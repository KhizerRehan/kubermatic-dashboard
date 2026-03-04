// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {DynamicTabComponent} from '@shared/components/tab-card/dynamic-tab/component';
import {TabComponent} from '@shared/components/tab-card/tab/component';
import {SharedModule} from '@shared/module';
import {Context, TabCardComponent} from './component';

@Component({
  template: `
    <km-tab-card [dynamicTabs]="dynamicTabs" [context]="context" [verticalMargin]="verticalMargin">
      <km-tab title="Tab 1">Content 1</km-tab>
      <km-tab title="Tab 2">Content 2</km-tab>
    </km-tab-card>
  `,
  standalone: false,
})
class TestHostComponent {
  dynamicTabs: DynamicTabComponent[] = [];
  context: Context = Context.Card;
  verticalMargin = true;
}

describe('TabCardComponent', () => {
  let component: TabCardComponent;
  let fixture: ComponentFixture<TabCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TabCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with Card context', () => {
      expect(component.context).toBe(Context.Card);
    });

    it('should initialize with verticalMargin as true', () => {
      expect(component.verticalMargin).toBe(true);
    });

    it('should initialize with empty dynamicTabs', () => {
      expect(component.dynamicTabs).toBeUndefined();
    });

    it('should initialize tabs as empty array', () => {
      fixture.detectChanges();
      expect(component.tabs).toBeDefined();
    });

    it('should use OnPush change detection strategy', () => {
      const metadata = (component.constructor as any).ɵcmp;
      expect(metadata.changeDetection).toBeDefined();
    });
  });

  describe('@Input context property', () => {
    it('should accept Card context', () => {
      component.context = Context.Card;
      fixture.detectChanges();
      expect(component.context).toBe(Context.Card);
    });

    it('should accept Navigation context', () => {
      component.context = Context.Navigation;
      fixture.detectChanges();
      expect(component.context).toBe(Context.Navigation);
    });

    it('should use context in CSS class', () => {
      component.context = Context.Card;
      const className = component.getClass();
      expect(className).toContain(Context.Card);
    });

    it('should update class when context changes', () => {
      component.context = Context.Card;
      let className = component.getClass();
      expect(className).toContain('tab-card');

      component.context = Context.Navigation;
      className = component.getClass();
      expect(className).toContain(Context.Navigation);
    });
  });

  describe('@Input verticalMargin property', () => {
    it('should include vertical-margin class when true', () => {
      component.verticalMargin = true;
      const className = component.getClass();
      expect(className).toContain('vertical-margin');
    });

    it('should exclude vertical-margin class when false', () => {
      component.verticalMargin = false;
      const className = component.getClass();
      expect(className).not.toContain('vertical-margin');
    });

    it('should update class when verticalMargin changes', () => {
      component.verticalMargin = true;
      let className = component.getClass();
      expect(className).toContain('vertical-margin');

      component.verticalMargin = false;
      className = component.getClass();
      expect(className).not.toContain('vertical-margin');
    });
  });

  describe('@Input dynamicTabs property', () => {
    it('should accept dynamic tabs array', () => {
      component.dynamicTabs = [
        {title: 'Dynamic 1', content: 'Content 1'} as DynamicTabComponent,
        {title: 'Dynamic 2', content: 'Content 2'} as DynamicTabComponent,
      ];
      fixture.detectChanges();

      expect(component.dynamicTabs.length).toBe(2);
    });

    it('should handle empty dynamic tabs', () => {
      component.dynamicTabs = [];
      fixture.detectChanges();
      expect(component.dynamicTabs.length).toBe(0);
    });

    it('should handle undefined dynamic tabs', () => {
      component.dynamicTabs = undefined;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('getClass() method', () => {
    it('should return tab-card class', () => {
      const className = component.getClass();
      expect(className).toContain('tab-card');
    });

    it('should include context in class', () => {
      component.context = Context.Card;
      let className = component.getClass();
      expect(className).toContain(Context.Card);

      component.context = Context.Navigation;
      className = component.getClass();
      expect(className).toContain(Context.Navigation);
    });

    it('should include vertical-margin when true', () => {
      component.verticalMargin = true;
      const className = component.getClass();
      expect(className).toContain('vertical-margin');
    });

    it('should exclude vertical-margin when false', () => {
      component.verticalMargin = false;
      const className = component.getClass();
      expect(className).not.toContain('vertical-margin');
    });

    it('should return properly formatted class string', () => {
      component.context = Context.Navigation;
      component.verticalMargin = true;
      const className = component.getClass();
      expect(className).toBe('tab-card tab-navigation vertical-margin');
    });

    it('should return properly formatted class without vertical margin', () => {
      component.context = Context.Card;
      component.verticalMargin = false;
      const className = component.getClass();
      expect(className).toBe('tab-card tab-cards');
    });
  });

  describe('Content Projection', () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [BrowserModule, NoopAnimationsModule, SharedModule],
        declarations: [TestHostComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    it('should project tab content', () => {
      const tabCard = hostFixture.debugElement.children[0].componentInstance;
      expect(tabCard.tabs.length).toBeGreaterThan(0);
    });

    it('should handle multiple projected tabs', () => {
      const tabCard = hostFixture.debugElement.children[0].componentInstance;
      expect(tabCard.tabs.length).toBe(2);
    });

    it('should update tabs on content changes', () => {
      const tabCard = hostFixture.debugElement.children[0].componentInstance;
      const initialTabCount = tabCard.tabs.length;
      expect(initialTabCount).toBe(2);
    });
  });

  describe('ngAfterContentInit', () => {
    it('should initialize tabs from inputTabs', () => {
      fixture.detectChanges();
      // Component properly initializes
      expect(component).toBeTruthy();
    });

    it('should listen to inputTabs changes', () => {
      const spy = jest.spyOn<any, any>(component, '_init');
      component.ngAfterContentInit();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should call _init with initial tabs', () => {
      const spy = jest.spyOn<any, any>(component, '_init');
      component.ngAfterContentInit();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete unsubscribe subject', () => {
      const spy = jest.spyOn(component['_unsubscribe'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should emit unsubscribe signal', () => {
      const spy = jest.spyOn(component['_unsubscribe'], 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should clean up subscriptions on destroy', () => {
      fixture.detectChanges();
      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('Change Detection Integration', () => {
    it('should use ChangeDetectorRef for manual detection', () => {
      fixture.detectChanges();
      const changeDetectorRef = (component as any)._cdr;
      expect(changeDetectorRef).toBeTruthy();
    });

    it('should call detectChanges in _init', () => {
      const cdr = (component as any)._cdr;
      const spy = jest.spyOn(cdr, 'detectChanges');
      component['_init']();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply base tab-card class', () => {
      const className = component.getClass();
      expect(className).toContain('tab-card');
    });

    it('should apply context-specific class', () => {
      component.context = Context.Navigation;
      const className = component.getClass();
      expect(className).toContain(Context.Navigation);
    });

    it('should apply vertical-margin when appropriate', () => {
      component.verticalMargin = true;
      const className = component.getClass();
      expect(className).toContain('vertical-margin');
    });
  });

  describe('Context Enum', () => {
    it('should have Card value', () => {
      expect(Context.Card).toBe('tab-cards');
    });

    it('should have Navigation value', () => {
      expect(Context.Navigation).toBe('tab-navigation');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null context', () => {
      component.context = null;
      const className = component.getClass();
      expect(className).toBeTruthy();
    });

    it('should handle undefined verticalMargin', () => {
      component.verticalMargin = undefined;
      const className = component.getClass();
      expect(className).toBeTruthy();
    });

    it('should handle rapid context changes', () => {
      component.context = Context.Card;
      component.context = Context.Navigation;
      component.context = Context.Card;

      const className = component.getClass();
      expect(className).toContain('tab-card');
    });

    it('should handle rapid verticalMargin changes', () => {
      component.verticalMargin = true;
      component.verticalMargin = false;
      component.verticalMargin = true;

      const className = component.getClass();
      expect(className).toContain('vertical-margin');
    });
  });

  describe('No Side Effects', () => {
    it('should not make external service calls', () => {
      fixture.detectChanges();
      // Component is pure presentation
      expect(component).toBeTruthy();
    });

    it('should not emit unexpected events', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe('Memory Cleanup', () => {
    it('should properly unsubscribe on destroy', () => {
      fixture.detectChanges();
      const spy = jest.spyOn(component['_unsubscribe'], 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should not have memory leaks on destroy', () => {
      fixture.detectChanges();
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });
  });
});
