import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Schema as ApplicationOptions, Style } from '@schematics/angular/application/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

import { strings } from '@angular-devkit/core';

const collectionPath = path.join(__dirname, '../../src/collection.json');


describe('hello-world', () => {
  let workspaceOptions: WorkspaceOptions;
  let appOptions: ApplicationOptions;

  beforeEach(() => {
    workspaceOptions = {
      name: 'workspace',
      newProjectRoot: 'projects',
      version: '0.0.1'
    };
    appOptions = {
      name: 'hello',
      inlineStyle: false,
      inlineTemplate: false,
      routing: false,
      style: Style.Scss,
      skipTests: false,
      skipPackageJson: false
    }
  });

  it('输出文件名：hello-arthur-ming.component.ts', async () => {
    const name = "ArthurMing";
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = await runner.runSchematicAsync('hello-world', { name }, Tree.empty()).toPromise();

    const dasherizeName = strings.dasherize(name);
    const fullFileName = `/hello-${dasherizeName}.component.ts`;
    expect(tree.files).toContain(fullFileName);

    const fileContent = tree.readContent(fullFileName);
    expect(fileContent).toMatch(/hello-arthur-ming/);
    expect(fileContent).toMatch(/HelloArthurMingComponent/);
  })

  it('在angular项目中生成hello-arthur-ming.component.ts', async () => {
    const options: HelloSchematics = { name: 'feature/Arthur Ming' };
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const workpsaceTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'workspace',
      workspaceOptions
    ).toPromise();
    const appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      appOptions,
      workpsaceTree
    ).toPromise();
    const tree = await runner.runSchematicAsync('hello-world', options, Tree.empty()).toPromise();
    expect(tree.files).toContain('/projects/hello/src/app/feature/hello-arthur-ming.component.ts');
  })
});
