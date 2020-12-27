import * as ts from 'typescript';

const sourceFile = ts.createSourceFile(
  'test.ts',
  `const name = 'Leo';`,
  ts.ScriptTarget.ES2015,
  true,
  ts.ScriptKind.TS
);
sourceFile.forEachChild(node => console.log(node.kind));
console.log('------');
console.log(sourceFile);
