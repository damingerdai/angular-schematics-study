import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Schema as ApplicationOptions, Style } from '@schematics/angular/application/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

const collectionPath = path.join(__dirname, '../../src/collection.json');


describe('ng add font-awesome', () => {
  const runner = new SchematicTestRunner('schematics', collectionPath)
  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '0.0.1'
  };
  const appOptions: ApplicationOptions = {
    name: 'hello',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: Style.Scss,
    skipTests: false,
    skipPackageJson: false
  }
  let appTree: UnitTestTree;

  beforeEach(async() => {
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'workspace',
      workspaceOptions
    ).toPromise();
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      appOptions,
      appTree
    ).toPromise();

  });

  it('在angular项目中添加 font-awesome', async () => {
    const tree = await runner.runSchematicAsync('ng-add', {}, appTree).toPromise();

    // 验证 Module 的内容
    const appModuleContent = tree.readContent('/projects/hello/src/app/app.module.ts');
    expect(appModuleContent).toMatch(/import.*FontAwesomeModule.*from '@fortawesome\/angular-fontawesome'/);
    expect(appModuleContent).toMatch(/imports:\s*\[[^\]]+?,\r?\n\s+FontAwesomeModule\r?\n/m);


    // 验证 Component 的内容
    const appComponentPath = tree.readContent('/projects/hello/src/app/app.component.ts');
    expect(appComponentPath).toMatch(/import.*faCoffee.*from '@fortawesome\/free-solid-svg-icons'/);
    expect(appComponentPath).toContain('faCoffee = faCoffee;');

    // 验证 HTML 的内容
    const htmlContent = tree.readContent('/projects/hello/src/app/app.component.html');
    expect(htmlContent).toContain('<fa-icon [icon]="faCoffee"></fa-icon>');

    // 验证 package.json
    const packageJson = JSON.parse(tree.readContent('/package.json'));
    const dependencies = packageJson.dependencies;
    expect(dependencies['@fortawesome/fontawesome-svg-core']).toBeDefined();
    expect(dependencies['@fortawesome/free-solid-svg-icons']).toBeDefined();
    expect(dependencies['@fortawesome/angular-fontawesome']).toBeDefined();

    expect(runner.tasks.some(task => task.name === 'node-package')).toBe(true);
  })
});
