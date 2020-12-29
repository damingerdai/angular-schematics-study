import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';

// 获取默认的路径
function buildDefaultPath(project: any): string {
  const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
  const projectDirName = project.projectType === 'application' ? 'app' : 'lib';
  return `${root}${projectDirName}`;
}


function readIntoSourceFile(host: Tree, modulePath: string): ts.SourceFile {
  const text = host.read(modulePath);
  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does noot exist`);
  }

  const sourceText = text.toString('utf-8');
  return ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
}


function sortObjectByKeys(obj: any) {
  return Object.keys(obj).sort().reduce((result, key) => (result[key] = obj[key]) && result, {} as any);
}

function addPackageToPackageJson(host: Tree, pkg: string, version: string): Tree {
  if (host.exists('package.json')) {
    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json.dependencies) {
      json.dependencies = {};
    }
    if (!json.dependencies[pkg]) {
      json.dependencies[pkg] = version;
      json.dependencies = sortObjectByKeys(json.dependencies);
    }
    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }

  return host;
}

export function ngAdd(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    // 如果不是 Angular 專案則拋出錯誤
    const workspaceConfigBuffer = _tree.read('angular.json');
    if (!workspaceConfigBuffer) {
      throw new SchematicsException('Not an Angular CLI workspace');
    }

    // 取得 project 的根目錄路徑
    const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
    const projectName = _options.project || workspaceConfig.defaultProject;
    const project = workspaceConfig.projects[projectName];
    const defaultProjectPath = buildDefaultPath(project);

    // 添加FontAwesomeModule
    const modulePath = `${defaultProjectPath}/app.module.ts`;
    const sourceFile = readIntoSourceFile(_tree, modulePath);
    const importPath = '@fortawesome/angular-fontawesome';
    const moduleName = 'FontAwesomeModule';
    const declarationChanges = addImportToModule(sourceFile, modulePath, moduleName, importPath);

    const declarationRecorder = _tree.beginUpdate(modulePath);
    for (const change of declarationChanges) {
      if (change instanceof InsertChange) {
        declarationRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    _tree.commitUpdate(declarationRecorder);

    // 新增 Font Awesome 的 CSS Class
    // 获取 AppComponent 的ast
    const appComponentPath = `${defaultProjectPath}/app.component.ts`;
    const appComponentSourceFile = readIntoSourceFile(_tree, appComponentPath);
    const allImports = appComponentSourceFile.statements.filter(node => ts.isImportDeclaration(node))! as ts.ImportDeclaration[];
    // 获取最后一个 ImportDeclaration
    let lastImport: ts.Node | undefined;
    for (const importNode of allImports) {
      if (!lastImport || importNode.getStart() > lastImport.getStart()) {
        lastImport = importNode;
      }
    }
    // 给AppComponent添加属性
    const classDeclaration = appComponentSourceFile.statements.find(node => ts.isClassDeclaration(node))! as ts.ClassDeclaration;
    // 获取最后一个property
     const allProperties = classDeclaration.members.filter(node => ts.isPropertyDeclaration(node))! as ts.PropertyDeclaration[];
    let lastProperty: ts.Node | undefined;
    for (const propertyNode of allProperties) {
      if (!lastProperty || propertyNode.getStart() > lastProperty.getStart()) {
        lastProperty = propertyNode;
      }
    }
    const importFaCoffee = '\nimport { faCoffee } from \'@fortawesome/free-solid-svg-icons\';';
    const faCoffeeProperty = 'faCoffee = faCoffee;'
    const changeText = lastProperty ? lastProperty.getFullText() : '';
    let toInsert = '';
    if (changeText.match(/^\r?\r?\n/)) {
      toInsert = `${changeText.match(/^\r?\n\s*/)![0]}${faCoffeeProperty}`;
    } else {
      toInsert = `\n  ${faCoffeeProperty}\n`;
    }
    const componentRecorder = _tree.beginUpdate(appComponentPath);
    componentRecorder.insertLeft(lastImport!.end, importFaCoffee);
    // 插入字串
    if (lastProperty) {
      componentRecorder.insertLeft(lastProperty!.end, toInsert);
    } else {
      componentRecorder.insertLeft(classDeclaration.end - 1, toInsert);
    }
    _tree.commitUpdate(componentRecorder);

    // 在app.component.html里加上‘<fa-icon [icon]="faCoffee"></fa-icon>’
    const htmlPath = `${defaultProjectPath}/app.component.html`;
    const htmlStr = `\n<fa-icon [icon]="faCoffee"></fa-icon>\n`;
    const htmlSourceFile = readIntoSourceFile(_tree, htmlPath);
    const htmlRecorder = _tree.beginUpdate(htmlPath);
    htmlRecorder.insertLeft(htmlSourceFile.end, htmlStr);
    _tree.commitUpdate(htmlRecorder);

    // 安装 library
    const dependencies = [
      { name: '@fortawesome/fontawesome-svg-core', version: '~1.2.25' },
      { name: '@fortawesome/free-solid-svg-icons', version: '~5.11.2' },
      { name: '@fortawesome/angular-fontawesome', version: '~0.5.0' }
    ];
    dependencies.forEach(dependency => {
      addPackageToPackageJson(
        _tree,
        dependency.name,
        dependency.version
      );
    });
    _context.addTask(
      new NodePackageInstallTask({
        packageName: dependencies.map(d => d.name).join(' '),
      })
    )
    return _tree;
  };
}
