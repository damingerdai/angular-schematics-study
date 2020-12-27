import { strings } from '@angular-devkit/core';
import {
  Rule,
  SchematicContext,
  Tree,
  SchematicsException,
  url,
  apply,
  template,
  move,
  mergeWith
} from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateName, validateHtmlSelector } from '@schematics/angular/utility/validation';
import { buildRelativePath, findModuleFromOptions, ModuleOptions } from '@schematics/angular/utility/find-module';
import { addDeclarationToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';


import * as ts from 'typescript';

function addExclamation(value: string): string {
  return value + '!';
}

function buildDefaultPath(project: any): string {
  const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
  const projectDirName = project.projectType === 'application' ? 'app' : 'lib';
  return `${root}${projectDirName}`;
}

export function helloWorld(_options: HelloSchematics): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {
    // 讀取 angular.json ，如果沒有這個檔案表示該專案不是 Angular 專案
    const workspaceConfigBuffer = _tree.read('angular.json');
    if (!workspaceConfigBuffer) {
      throw new SchematicsException('Not an Angular CLI workspace');
    }

    // 解析出專案的正確路徑與檔名
    const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
    const projectName = _options.project || workspaceConfig.defaultProject;
    if (!projectName) {
      throw new SchematicsException('no ' + projectName + ' project');
    }
    const project = workspaceConfig.projects[projectName];
    const defaultProjectPath = buildDefaultPath(project);
    const parsePath = parseName(defaultProjectPath, _options.name);
    const { name, path } = parsePath;
    // 加入名字跟 selector 的校验
    validateName(name);
    validateHtmlSelector(`hello-${strings.dasherize(name)}`);
    // 用 findModuleFromOptions 找出關連度最高的 module.ts 的 path
    const moduleOptions: ModuleOptions = { name: name, path: path };
    const modulePath = findModuleFromOptions(_tree, moduleOptions) || '';

    const sourceFile = ts.createSourceFile(
      'test.ts',
      (_tree.read(modulePath) || []).toString(),
      ts.ScriptTarget.Latest,
      true
    );

    const componentPath = `${path}/hello-${strings.dasherize(name)}.component`;
    const classifiedName = `Hello${strings.classify(name)}Component`;
    const relativePath = buildRelativePath(modulePath, componentPath);
    // 用 addDeclarationToModule 取得變動的內容（ InsertChange ）
    const declarationChanges = addDeclarationToModule(sourceFile, modulePath, classifiedName, relativePath);

    // apply更新
    const declarationRecorder = _tree.beginUpdate(modulePath);
    for (const change of declarationChanges) {
      if (change instanceof InsertChange) {
        declarationRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    _tree.commitUpdate(declarationRecorder);

    const sourceTemplates = url('./files');
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      template({
        ..._options,
        ...strings,
        addExclamation,
        name // 蓋過原本的 _options.name，避免使用錯誤的檔名
      }),
      move(path) // 將產生出來的檔案移到正確的目錄下
    ]);

    return mergeWith(sourceParametrizedTemplates);
  };
}
