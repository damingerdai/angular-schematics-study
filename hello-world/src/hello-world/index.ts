import { Rule, SchematicContext, Tree, url, apply, template, mergeWith } from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';

function addExclamation(value: string): string {
  return value + '!';
}

export function helloWorld(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const sourceTemplates = url('./files'); 
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      template({
        ..._options, // 使用者所輸入的參數
        ...strings,
        addExclamation
      })
    ]);

    return mergeWith(sourceParametrizedTemplates)
  };
}
