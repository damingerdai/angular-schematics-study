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
import { buildRelativePath } from '@schematics/angular/utility/find-module';

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

    // 获取AppModule
    const text = _tree.read(defaultProjectPath + '/app.module.ts') || [];
    const sourceFile = ts.createSourceFile(
      'test.ts',
      text.toString(), // 轉成字串後丟進去以產生檔案，方便後續操作
      ts.ScriptTarget.Latest
    );
    // 获取class
    const classDeclaration = sourceFile.statements.find(node => ts.isClassDeclaration(node))! as ts.ClassDeclaration;
    // 获取装饰器
    const decorator = classDeclaration.decorators![0] as ts.Decorator;
    const callExpression = decorator.expression as ts.CallExpression;
    const objectLiteralExpression = callExpression.arguments[0] as ts.ObjectLiteralExpression;
    const propertyAssignment = objectLiteralExpression.properties.find((property: ts.PropertyAssignment) => {
      return (property.name as ts.Identifier)?.escapedText === 'declarations'
    })! as ts.PropertyAssignment;
    const arrayLiteralExpression = propertyAssignment.initializer as ts.ArrayLiteralExpression;
    const identifier = arrayLiteralExpression.elements[0] as ts.Identifier;
    const declarationRecorder = _tree.beginUpdate(defaultProjectPath + '/app.module.ts');
    // 更新 declarations
    const changeText = identifier.getFullText(sourceFile);
    let toInsert = '';
    // 如果原本的字串內容有換行符號
    if (changeText.match(/^\r?\r?\n/)) {
      // 就把換行符號與字串前的空白加到字串裡
      toInsert = `,${changeText.match(/^\r?\n\s*/)![0]}Hello${strings.classify(name)}Component`;
    } else {
      toInsert = `, Hello${strings.classify(name)}Component`;
    }
    declarationRecorder.insertLeft(identifier.end, toInsert);
    //_tree.commitUpdate(declarationRecorder);

    // 更新import
    const allImports = sourceFile.statements.filter( node => ts.isImportDeclaration(node) )! as ts.ImportDeclaration[];
    // 获取最后一个import
    let lastImport: ts.Node | undefined;
    for (const importNode of allImports) {
      if ( !lastImport || importNode.getStart(sourceFile) > lastImport.getStart(sourceFile) ) {
        lastImport = importNode;
      }
    }
    const modulePath = defaultProjectPath + '/app.module.ts';
    const componentPath = `${parsePath.path}/hello-${parsePath.name}.component.ts`;
    const importStr = `\nimport { Hello${strings.classify(name)}Component } from '${buildRelativePath(modulePath, componentPath)}';`;
    declarationRecorder.insertLeft(lastImport!.end, importStr);

    // 更新
    _tree.commitUpdate(declarationRecorder);

    // 重新讀取檔案並印出來看看
    console.log(_tree.read(defaultProjectPath + '/app.module.ts')!.toString());
    return mergeWith(sourceParametrizedTemplates);
  };
}
