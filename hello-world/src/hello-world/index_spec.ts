import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';


const collectionPath = path.join(__dirname, '../../src/collection.json');


describe('hello-world', () => {
  it('default', async () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = await runner.runSchematicAsync('hello-world', {}, Tree.empty()).toPromise();

    expect(tree.files).toContain('/hello');
  });

  it('with name', async () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = await runner.runSchematicAsync('hello-world', { name: 'damingerdai'}, Tree.empty()).toPromise();

    expect(tree.files).toContain('/damingerdai');
    expect(tree.readContent('/damingerdai')).toEqual('world');
  });
});
