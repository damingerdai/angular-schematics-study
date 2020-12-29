import { Component, Input } from '@angular/core';

@Component({
    selector: 'hello-arthur-ming',
    template: `<h1>Hello {{arthur-ming!}}!</h1>`,
    styles: [`h1 { font-family: Lato; }`]
})
export class HelloArthurMingComponent {
    @Input() name: string;
}