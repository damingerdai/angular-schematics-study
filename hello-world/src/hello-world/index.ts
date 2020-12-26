import { Rule, SchematicContext, Tree, url, apply, template, mergeWith } from '@angular-devkit/schematics';


export function helloWorld(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const sourceTemplates = url('./files'); 
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      template({
        ..._options, // 使用者所輸入的參數
      })
    ]);

    return mergeWith(sourceParametrizedTemplates)
  };
}
