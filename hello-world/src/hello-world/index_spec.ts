import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Schema as ApplicationOptions, Style } from '@schematics/angular/application/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

import { strings } from '@angular-devkit/core';

const collectionPath = path.join(__dirname, '../../src/collection.json');


describe('hello-world', () => {
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
  const defalutOptions: HelloSchematics = {
    name: 'feature/Arthur Ming'
  };
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

  it('输出文件名：hello-arthur-ming.component.ts', async () => {
    const options: HelloSchematics = { ...defalutOptions };
    const tree = await runner.runSchematicAsync('hello-world', options, appTree).toPromise();
    const fullFileName = `/projects/hello/src/app/feature/hello-arthur-ming.component.ts`;
    expect(tree.files).toContain(fullFileName);
  })

  it('在angular项目中生成hello-arthur-ming.component.ts', async () => {
    const options: HelloSchematics = { ...defalutOptions };
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      { ...appOptions, name: 'world' },
      appTree
    ).toPromise();
    const tree = await runner.runSchematicAsync('hello-world', options, appTree).toPromise();
    expect(tree.files).toContain('/projects/hello/src/app/feature/hello-arthur-ming.component.ts');
  })
});
