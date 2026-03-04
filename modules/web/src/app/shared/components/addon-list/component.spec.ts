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
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AddonService} from '@core/services/addon';
import {BrandingService} from '@core/services/branding';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {Addon, AddonConfig} from '@shared/entity/addon';
import {Cluster} from '@shared/entity/cluster';
import {SharedModule} from '@shared/module';
import {BrandingMockService} from '@test/services/branding-mock';
import {of} from 'rxjs';
import {AddonsListComponent} from './component';

describe('AddonsListComponent', () => {
  let fixture: ComponentFixture<AddonsListComponent>;
  let component: AddonsListComponent;
  let addonService: jasmine.SpyObj<AddonService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let dialogModeService: jasmine.SpyObj<DialogModeService>;

  const mockAddonConfig: AddonConfig = {
    name: 'test-addon',
    isDefault: false,
    description: 'Test addon description',
  };

  const mockAddon: Addon = {
    id: 'test-addon-1',
    name: 'test-addon',
    creationTimestamp: new Date().toISOString(),
    deletionTimestamp: null,
    spec: {
      variables: {},
      isDefault: false,
    },
    status: {
      phase: 'Ready',
      conditions: [],
    },
    count: 1,
  };

  const mockCluster: Cluster = {
    id: 'test-cluster',
    name: 'test-cluster',
    type: 'kubernetes',
    spec: {} as any,
    status: {} as any,
    creationTimestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    const addonServiceSpy = jasmine.createSpyObj('AddonService', [], {
      accessibleAddons: of(['test-addon', 'another-addon']),
      addonConfigs: of([mockAddonConfig]),
    });

    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const dialogModeServiceSpy = jasmine.createSpyObj('DialogModeService', [], {
      isEditDialog: false,
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: AddonService, useValue: addonServiceSpy},
        {provide: MatDialog, useValue: matDialogSpy},
        {provide: DialogModeService, useValue: dialogModeServiceSpy},
        {provide: BrandingService, useClass: BrandingMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    addonService = TestBed.inject(AddonService) as jasmine.SpyObj<AddonService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    dialogModeService = TestBed.inject(DialogModeService) as jasmine.SpyObj<DialogModeService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddonsListComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should initialize component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.addons).toEqual([]);
      expect(component.isClusterReady).toBeTruthy();
      expect(component.canEdit).toBeTruthy();
    });

    it('should load accessible addons on init', (done: DoneFn) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.accessibleAddons).toContain('test-addon');
        expect(component.accessibleAddons).toContain('another-addon');
        done();
      }, 0);
    });

    it('should load addon configs on init', (done: DoneFn) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.addonConfigs.has('test-addon')).toBeTruthy();
        expect(component.addonConfigs.get('test-addon')).toEqual(mockAddonConfig);
        done();
      }, 0);
    });
  });

  describe('@Input bindings', () => {
    it('should update installable addons when addons input changes', () => {
      component.accessibleAddons = ['test-addon', 'another-addon', 'third-addon'];
      component.addons = [mockAddon];

      component.ngOnChanges({});

      expect(component.installableAddons).toContain('another-addon');
      expect(component.installableAddons).toContain('third-addon');
      expect(component.installableAddons).not.toContain('test-addon');
    });

    it('should handle empty addons array', () => {
      component.accessibleAddons = ['test-addon', 'another-addon'];
      component.addons = [];

      component.ngOnChanges({});

      expect(component.installableAddons).toEqual(['test-addon', 'another-addon']);
    });

    it('should handle isClusterReady property', () => {
      component.accessibleAddons = ['test-addon'];
      component.addons = [];
      component.isClusterReady = false;
      component.canEdit = true;

      expect(component.canAdd()).toBeFalsy();
    });

    it('should handle canEdit property', () => {
      component.accessibleAddons = ['test-addon'];
      component.addons = [];
      component.isClusterReady = true;
      component.canEdit = false;

      expect(component.canAdd()).toBeFalsy();
    });
  });

  describe('canAdd method', () => {
    it('should return true when all conditions met', () => {
      component.isClusterReady = true;
      component.canEdit = true;
      component.accessibleAddons = ['test-addon', 'another-addon'];
      component.addons = [mockAddon];

      expect(component.canAdd()).toBeTruthy();
    });

    it('should return false when cluster not ready', () => {
      component.isClusterReady = false;
      component.canEdit = true;
      component.accessibleAddons = ['test-addon'];
      component.addons = [];

      expect(component.canAdd()).toBeFalsy();
    });

    it('should return false when cannot edit', () => {
      component.isClusterReady = true;
      component.canEdit = false;
      component.accessibleAddons = ['test-addon'];
      component.addons = [];

      expect(component.canAdd()).toBeFalsy();
    });

    it('should return false when no accessible addons', () => {
      component.isClusterReady = true;
      component.canEdit = true;
      component.accessibleAddons = [];
      component.addons = [];

      expect(component.canAdd()).toBeFalsy();
    });

    it('should return false when all addons already installed', () => {
      component.isClusterReady = true;
      component.canEdit = true;
      component.accessibleAddons = ['test-addon'];
      component.addons = [mockAddon];

      expect(component.canAdd()).toBeFalsy();
    });
  });

  describe('getAddBtnTooltip method', () => {
    it('should return permission message when cannot edit', () => {
      component.canEdit = false;

      const tooltip = component.getAddBtnTooltip();

      expect(tooltip).toContain('no permissions');
    });

    it('should return no addons available message', () => {
      component.canEdit = true;
      component.accessibleAddons = [];

      const tooltip = component.getAddBtnTooltip();

      expect(tooltip).toContain('no accessible addons');
    });

    it('should return all installed message when all addons installed', () => {
      component.canEdit = true;
      component.accessibleAddons = ['test-addon'];
      component.addons = [mockAddon];

      const tooltip = component.getAddBtnTooltip();

      expect(tooltip).toContain('already installed');
    });

    it('should return empty string when can add', () => {
      component.canEdit = true;
      component.accessibleAddons = ['test-addon', 'another-addon'];
      component.addons = [mockAddon];

      const tooltip = component.getAddBtnTooltip();

      expect(tooltip).toBe('');
    });
  });

  describe('getTooltip method', () => {
    it('should return deletion message for addon being deleted', () => {
      const addonBeingDeleted: Addon = {
        ...mockAddon,
        deletionTimestamp: new Date().toISOString(),
      };

      const tooltip = component.getTooltip(addonBeingDeleted);

      expect(tooltip).toContain('being deleted');
    });

    it('should return empty string for normal addon', () => {
      const tooltip = component.getTooltip(mockAddon);

      expect(tooltip).toBe('');
    });
  });

  describe('@Output events', () => {
    it('should emit addAddon event when add dialog closes with addon', (done: DoneFn) => {
      const mockDialogRef = {afterClosed: () => of(mockAddon)} as any;
      matDialog.open.and.returnValue(mockDialogRef);

      spyOn(component.addAddon, 'emit');
      component.accessibleAddons = ['test-addon'];
      component.addons = [];
      component.canEdit = true;
      component.isClusterReady = true;

      component.add();

      setTimeout(() => {
        expect(component.addAddon.emit).toHaveBeenCalledWith(mockAddon);
        done();
      }, 0);
    });

    it('should not emit addAddon when dialog closes without addon', (done: DoneFn) => {
      const mockDialogRef = {afterClosed: () => of(null)} as any;
      matDialog.open.and.returnValue(mockDialogRef);

      spyOn(component.addAddon, 'emit');
      component.accessibleAddons = ['test-addon'];
      component.addons = [];
      component.canEdit = true;
      component.isClusterReady = true;

      component.add();

      setTimeout(() => {
        expect(component.addAddon.emit).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should emit editAddon event when edit dialog closes with addon', (done: DoneFn) => {
      const mockDialogRef = {afterClosed: () => of(mockAddon)} as any;
      matDialog.open.and.returnValue(mockDialogRef);
      component.cluster = mockCluster;
      component.addonConfigs.set('test-addon', mockAddonConfig);

      spyOn(component.editAddon, 'emit');

      component.edit(mockAddon);

      setTimeout(() => {
        expect(component.editAddon.emit).toHaveBeenCalledWith(mockAddon);
        expect(dialogModeService.isEditDialog).toBeFalsy();
        done();
      }, 0);
    });

    it('should set isEditDialog flag during edit', () => {
      const mockDialogRef = {afterClosed: () => of(null)} as any;
      matDialog.open.and.returnValue(mockDialogRef);
      component.cluster = mockCluster;
      component.addonConfigs.set('test-addon', mockAddonConfig);

      spyOn(component.editAddon, 'emit');

      component.edit(mockAddon);

      // Dialog mode was set to true at some point
      expect(matDialog.open).toHaveBeenCalled();
    });

    it('should emit deleteAddon event when confirmation confirmed', (done: DoneFn) => {
      const mockDialogRef = {afterClosed: () => of(true)} as any;
      matDialog.open.and.returnValue(mockDialogRef);
      component.cluster = mockCluster;

      spyOn(component.deleteAddon, 'emit');

      component.delete(mockAddon);

      setTimeout(() => {
        expect(component.deleteAddon.emit).toHaveBeenCalledWith(mockAddon);
        done();
      }, 0);
    });

    it('should not emit deleteAddon when confirmation cancelled', (done: DoneFn) => {
      const mockDialogRef = {afterClosed: () => of(false)} as any;
      matDialog.open.and.returnValue(mockDialogRef);
      component.cluster = mockCluster;

      spyOn(component.deleteAddon, 'emit');

      component.delete(mockAddon);

      setTimeout(() => {
        expect(component.deleteAddon.emit).not.toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('logo display', () => {
    it('should check if addon has logo', () => {
      component.addonConfigs.set('test-addon', {
        ...mockAddonConfig,
        logoData: 'data:image/svg+xml;base64,test',
      });

      const hasLogo = component.hasLogo('test-addon');

      expect(hasLogo).toBeTruthy();
    });

    it('should return false for addon without logo', () => {
      component.addonConfigs.set('test-addon', mockAddonConfig);

      const hasLogo = component.hasLogo('test-addon');

      expect(hasLogo).toBeFalsy();
    });

    it('should get logo data when available', () => {
      const logoData = 'data:image/svg+xml;base64,test';
      component.addonConfigs.set('test-addon', {
        ...mockAddonConfig,
        logoData: logoData,
      });

      const logo = component.getAddonLogo('test-addon');

      expect(logo).toBe(logoData);
    });
  });

  describe('add method', () => {
    it('should not open dialog when canAdd is false', () => {
      component.isClusterReady = false;

      component.add();

      expect(matDialog.open).not.toHaveBeenCalled();
    });

    it('should open install addon dialog when canAdd is true', () => {
      const mockDialogRef = {afterClosed: () => of(null)} as any;
      matDialog.open.and.returnValue(mockDialogRef);
      component.isClusterReady = true;
      component.canEdit = true;
      component.accessibleAddons = ['test-addon'];
      component.addons = [];
      component.installableAddons = ['test-addon'];

      component.add();

      expect(matDialog.open).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();
      spyOn(component['_unsubscribe'], 'next');
      spyOn(component['_unsubscribe'], 'complete');

      component.ngOnDestroy();

      expect(component['_unsubscribe'].next).toHaveBeenCalled();
      expect(component['_unsubscribe'].complete).toHaveBeenCalled();
    });
  });
});
