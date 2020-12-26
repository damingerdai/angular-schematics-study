import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

import { strings } from '@angular-devkit/core';

const collectionPath = path.join(__dirname, '../../src/collection.json');


describe('hello-world', () => {
  it('输出文件名：hello-arthur-ming.component.ts', async() => {
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
});
