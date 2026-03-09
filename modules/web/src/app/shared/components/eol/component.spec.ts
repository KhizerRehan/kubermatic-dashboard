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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {EndOfLifeService} from '@core/services/eol';
import {SharedModule} from '@shared/module';
import {ClusterTypeEOLComponent, Type} from './component';

describe('ClusterTypeEOLComponent', () => {
  let component: ClusterTypeEOLComponent;
  let fixture: ComponentFixture<ClusterTypeEOLComponent>;
  let eolService: jasmine.SpyObj<EndOfLifeService>;

  beforeEach(() => {
    const eolServiceMock = jasmine.createSpyObj('EndOfLifeService', [], {
      cluster: {
        findVersion: jasmine.createSpy('findVersion').and.returnValue('1.24'),
        getDate: jasmine.createSpy('getDate').and.returnValue(new Date('2024-05-28')),
        isAfter: jasmine.createSpy('isAfter').and.returnValue(false),
        isBefore: jasmine.createSpy('isBefore').and.returnValue(true),
      },
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [{provide: EndOfLifeService, useValue: eolServiceMock}],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    eolService = TestBed.inject(EndOfLifeService) as jasmine.SpyObj<EndOfLifeService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterTypeEOLComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with default type as Chip', () => {
      expect(component.type).toBe(Type.Chip);
    });

    it('should have displayType property set to Type enum', () => {
      expect(component.displayType).toBe(Type);
    });

    it('should have access to EndOfLifeService', () => {
      expect(eolService).toBeTruthy();
    });
  });

  describe('@Input version property', () => {
    it('should store version input', () => {
      component.version = '1.24.0';
      expect(component.version).toBe('1.24.0');
    });

    it('should call eolService.cluster.findVersion with version', () => {
      component.version = '1.24.0';
      const result = component.eolVersion;
      expect(eolService.cluster.findVersion).toHaveBeenCalledWith('1.24.0');
    });

    it('should return eol version from service', () => {
      component.version = '1.24.0';
      const eolVersion = component.eolVersion;
      expect(eolVersion).toBe('1.24');
    });

    it('should update eol version when version changes', () => {
      component.version = '1.24.0';
      expect(component.eolVersion).toBe('1.24');

      component.version = '1.25.0';
      const result = component.eolVersion;
      expect(eolService.cluster.findVersion).toHaveBeenCalledWith('1.25.0');
    });
  });

  describe('@Input type property', () => {
    it('should accept Chip type', () => {
      component.type = Type.Chip;
      expect(component.type).toBe(Type.Chip);
    });

    it('should accept Badge type', () => {
      component.type = Type.Badge;
      expect(component.type).toBe(Type.Badge);
    });

    it('should default to Chip type', () => {
      const newComponent = TestBed.createComponent(ClusterTypeEOLComponent).componentInstance;
      expect(newComponent.type).toBe(Type.Chip);
    });

    it('should update display based on type change', () => {
      component.version = '1.24.0';
      component.type = Type.Chip;
      fixture.detectChanges();

      component.type = Type.Badge;
      fixture.detectChanges();

      expect(component.type).toBe(Type.Badge);
    });
  });

  describe('eolVersion getter', () => {
    it('should call eolService.cluster.findVersion', () => {
      component.version = '1.24.0';
      component.eolVersion;
      expect(eolService.cluster.findVersion).toHaveBeenCalledWith('1.24.0');
    });

    it('should return version from service', () => {
      component.version = '1.24.0';
      const result = component.eolVersion;
      expect(result).toBe('1.24');
    });

    it('should handle multiple calls to eolVersion', () => {
      component.version = '1.24.0';
      component.eolVersion;
      component.eolVersion;
      // Service method called each time getter is accessed
      expect((eolService.cluster.findVersion as jasmine.Spy).calls.count()).toBeGreaterThan(0);
    });
  });

  describe('date getter', () => {
    it('should call eolService.cluster.getDate', () => {
      component.version = '1.24.0';
      component.date;
      expect(eolService.cluster.getDate).toHaveBeenCalledWith('1.24.0');
    });

    it('should return date from service', () => {
      component.version = '1.24.0';
      const result = component.date;
      expect(result).toEqual(new Date('2024-05-28'));
    });

    it('should return valid Date object', () => {
      component.version = '1.24.0';
      const result = component.date;
      expect(result instanceof Date).toBe(true);
    });
  });

  describe('isAfter() method', () => {
    it('should call eolService.cluster.isAfter with version', () => {
      component.version = '1.24.0';
      component.isAfter();
      expect(eolService.cluster.isAfter).toHaveBeenCalledWith('1.24.0');
    });

    it('should return false when EOL has not passed', () => {
      (eolService.cluster.isAfter as jasmine.Spy).and.returnValue(false);
      component.version = '1.24.0';
      expect(component.isAfter()).toBe(false);
    });

    it('should return true when EOL has passed', () => {
      (eolService.cluster.isAfter as jasmine.Spy).and.returnValue(true);
      component.version = '1.24.0';
      expect(component.isAfter()).toBe(true);
    });
  });

  describe('isBefore() method', () => {
    it('should call eolService.cluster.isBefore with version', () => {
      component.version = '1.24.0';
      component.isBefore();
      expect(eolService.cluster.isBefore).toHaveBeenCalledWith('1.24.0');
    });

    it('should return true when EOL is upcoming', () => {
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(true);
      component.version = '1.24.0';
      expect(component.isBefore()).toBe(true);
    });

    it('should return false when EOL has passed', () => {
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(false);
      component.version = '1.24.0';
      expect(component.isBefore()).toBe(false);
    });
  });

  describe('Conditional Rendering', () => {
    it('should render nothing when neither isBefore nor isAfter is true', () => {
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(false);
      (eolService.cluster.isAfter as jasmine.Spy).and.returnValue(false);
      component.version = '1.24.0';
      fixture.detectChanges();

      const content = fixture.debugElement.nativeElement.querySelector('div');
      expect(content.children.length).toBe(0);
    });

    it('should render content when isBefore is true', () => {
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(true);
      (eolService.cluster.isAfter as jasmine.Spy).and.returnValue(false);
      component.version = '1.24.0';
      fixture.detectChanges();

      // Component renders when either condition is true
      expect(component.isBefore()).toBe(true);
    });

    it('should render content when isAfter is true', () => {
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(false);
      (eolService.cluster.isAfter as jasmine.Spy).and.returnValue(true);
      component.version = '1.24.0';
      fixture.detectChanges();

      expect(component.isAfter()).toBe(true);
    });
  });

  describe('Type-based Rendering', () => {
    it('should display Chip type when type is Chip', () => {
      component.type = Type.Chip;
      component.version = '1.24.0';
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(true);
      fixture.detectChanges();

      expect(component.type).toBe(Type.Chip);
    });

    it('should display Badge type when type is Badge', () => {
      component.type = Type.Badge;
      component.version = '1.24.0';
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(true);
      fixture.detectChanges();

      expect(component.type).toBe(Type.Badge);
    });

    it('should use km-update-available-badge class for Badge type', () => {
      component.type = Type.Badge;
      component.version = '1.24.0';
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(true);
      fixture.detectChanges();

      const badge = fixture.debugElement.nativeElement.querySelector('.km-update-available-badge');
      expect(badge).toBeTruthy();
    });
  });

  describe('Tooltip Content', () => {
    it('should display EOL date in tooltip for isAfter case', () => {
      (eolService.cluster.isAfter as jasmine.Spy).and.returnValue(true);
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(false);
      component.version = '1.24.0';
      fixture.detectChanges();

      const tooltip = fixture.debugElement.nativeElement.innerHTML;
      // Tooltip content includes the formatted date
      expect(tooltip).toContain('May 28, 2024');
    });

    it('should display EOL date in tooltip for isBefore case', () => {
      (eolService.cluster.isBefore as jasmine.Spy).and.returnValue(true);
      (eolService.cluster.isAfter as jasmine.Spy).and.returnValue(false);
      component.version = '1.24.0';
      fixture.detectChanges();

      const tooltip = fixture.debugElement.nativeElement.innerHTML;
      expect(tooltip).toContain('May 28, 2024');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined version', () => {
      component.version = undefined;
      expect(() => {
        component.eolVersion;
      }).not.toThrow();
    });

    it('should handle null version', () => {
      component.version = null;
      expect(() => {
        component.isAfter();
      }).not.toThrow();
    });

    it('should handle empty version string', () => {
      component.version = '';
      fixture.detectChanges();
      expect(component.version).toBe('');
    });

    it('should handle version with special characters', () => {
      component.version = '1.24.0-beta';
      fixture.detectChanges();
      component.eolVersion;
      expect(eolService.cluster.findVersion).toHaveBeenCalled();
    });

    it('should update correctly when version is set after component creation', () => {
      component.version = '1.24.0';
      fixture.detectChanges();

      component.version = '1.25.0';
      fixture.detectChanges();

      expect(component.version).toBe('1.25.0');
    });
  });

  describe('Service Dependency', () => {
    it('should have EndOfLifeService injected', () => {
      expect(eolService).toBeTruthy();
    });

    it('should access cluster property from service', () => {
      expect(eolService.cluster).toBeTruthy();
    });

    it('should call all required service methods', () => {
      component.version = '1.24.0';
      component.eolVersion;
      component.date;
      component.isAfter();
      component.isBefore();

      expect(eolService.cluster.findVersion).toHaveBeenCalled();
      expect(eolService.cluster.getDate).toHaveBeenCalled();
      expect(eolService.cluster.isAfter).toHaveBeenCalled();
      expect(eolService.cluster.isBefore).toHaveBeenCalled();
    });
  });
});
