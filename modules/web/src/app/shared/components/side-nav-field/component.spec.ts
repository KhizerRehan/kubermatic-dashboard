// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {Router} from '@angular/router';
import {ChangeDetectorRef} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';

import {SideNavExpansionMenuComponent} from './component';
import {AdminPanelSections, AdminPanelView, ProjectSidenavSection, View} from '@app/shared/entity/common';
import {WizardMode} from '@app/wizard/types/wizard-mode';

describe('SideNavExpansionMenuComponent', () => {
  let fixture: ComponentFixture<SideNavExpansionMenuComponent>;
  let component: SideNavExpansionMenuComponent;
  let router: jasmine.SpyObj<Router>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', [], {
      routerState: {
        snapshot: {
          url: '/projects/test-project/clusters',
        },
      },
    });

    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    TestBed.configureTestingModule({
      imports: [SideNavExpansionMenuComponent, NoopAnimationsModule, MatMenuModule, MatTooltipModule],
      providers: [
        {provide: Router, useValue: routerSpy},
        {provide: ChangeDetectorRef, useValue: cdrSpy},
      ],
    });

    fixture = TestBed.createComponent(SideNavExpansionMenuComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.icon).toBe('');
      expect(component.isSidenavCollapsed).toBeUndefined();
      expect(component.lastItem).toBe(false);
    });

    it('should initialize expanded to false', () => {
      expect(component.expanded).toBe(false);
    });

    it('should set expanded to true for Resources section on init', () => {
      component.label = ProjectSidenavSection.Resources;
      component.ngOnInit();

      expect(component.expanded).toBe(true);
    });

    it('should set expanded to false for non-Resources sections on init', () => {
      component.label = ProjectSidenavSection.Access;
      component.ngOnInit();

      expect(component.expanded).toBe(false);
    });
  });

  describe('@Input properties', () => {
    it('should accept label input', () => {
      component.label = ProjectSidenavSection.Resources;
      expect(component.label).toBe(ProjectSidenavSection.Resources);
    });

    it('should accept icon input', () => {
      component.icon = 'km-icon-cluster';
      expect(component.icon).toBe('km-icon-cluster');
    });

    it('should accept isSidenavCollapsed input', () => {
      component.isSidenavCollapsed = true;
      expect(component.isSidenavCollapsed).toBe(true);
    });

    it('should accept lastItem input', () => {
      component.lastItem = true;
      expect(component.lastItem).toBe(true);
    });

    it('should accept admin panel sections', () => {
      component.label = AdminPanelSections.Users;
      expect(component.label).toBe(AdminPanelSections.Users);
    });
  });

  describe('ID Generation', () => {
    it('should replace spaces with dashes in id', () => {
      component.label = 'My Label';
      expect(component.id).toBe('My-Label');
    });

    it('should generate id from ProjectSidenavSection.Resources', () => {
      component.label = ProjectSidenavSection.Resources;
      expect(component.id).toBe(ProjectSidenavSection.Resources.replace(' ', '-'));
    });

    it('should generate id from ProjectSidenavSection.Access', () => {
      component.label = ProjectSidenavSection.Access;
      expect(component.id).toBe(ProjectSidenavSection.Access.replace(' ', '-'));
    });

    it('should handle labels without spaces', () => {
      component.label = 'Backups';
      expect(component.id).toBe('Backups');
    });
  });

  describe('URL Checking', () => {
    it('should check if url contains specific view', () => {
      setUrl('/projects/test-project/clusters');
      expect(component.checkUrl(View.Clusters)).toBe(true);
    });

    it('should return false for non-matching url', () => {
      setUrl('/projects/test-project/members');
      expect(component.checkUrl(View.Clusters)).toBe(false);
    });

    it('should check for ssh-keys in url', () => {
      setUrl('/projects/test-project/ssh-keys');
      expect(component.checkUrl(View.SSHKeys)).toBe(true);
    });

    it('should check for members in url', () => {
      setUrl('/projects/test-project/members');
      expect(component.checkUrl(View.Members)).toBe(true);
    });

    it('should check for groups in url', () => {
      setUrl('/projects/test-project/groups');
      expect(component.checkUrl(View.Groups)).toBe(true);
    });

    it('should handle clusters with excluded external clusters', () => {
      setUrl('/projects/test-project/clusters');
      const result = component.checkUrl(View.Clusters);
      expect(result).toBe(true);
    });

    it('should return false when clusters url contains external-clusters', () => {
      setUrl('/projects/test-project/external-clusters');
      const result = component.checkUrl(View.Clusters);
      expect(result).toBe(false);
    });

    it('should check for external clusters view', () => {
      setUrl('/projects/test-project/external-clusters');
      expect(component.checkUrl(View.ExternalClusters)).toBe(true);
    });

    it('should check for kubevirt clusters view', () => {
      setUrl('/projects/test-project/kubevirt-clusters');
      expect(component.checkUrl(View.KubeOneClusters)).toBe(true);
    });
  });

  describe('Project Expanded Active', () => {
    beforeEach(() => {
      component.label = ProjectSidenavSection.Resources;
    });

    it('should return true for Resources section when on clusters page', () => {
      setUrl('/projects/test-project/clusters');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for Resources section when on external-clusters page', () => {
      setUrl('/projects/test-project/external-clusters');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for Backups section when on backups page', () => {
      component.label = ProjectSidenavSection.Backups;
      setUrl('/projects/test-project/backups');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for Backups section when on snapshots page', () => {
      component.label = ProjectSidenavSection.Backups;
      setUrl('/projects/test-project/snapshots');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for Access section when on members page', () => {
      component.label = ProjectSidenavSection.Access;
      setUrl('/projects/test-project/members');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for Access section when on ssh-keys page', () => {
      component.label = ProjectSidenavSection.Access;
      setUrl('/projects/test-project/ssh-keys');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for Access section when on groups page', () => {
      component.label = ProjectSidenavSection.Access;
      setUrl('/projects/test-project/groups');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for Access section when on service-accounts page', () => {
      component.label = ProjectSidenavSection.Access;
      setUrl('/projects/test-project/service-accounts');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return true for ClusterBackups section when on backup views', () => {
      component.label = ProjectSidenavSection.ClusterBackups;
      setUrl('/projects/test-project/cluster-backup');
      expect(component.isProjectExpandedActive()).toBe(true);
    });

    it('should return false for unknown section', () => {
      setUrl('/projects/test-project/clusters');
      expect(component.isProjectExpandedActive()).toBe(true);
    });
  });

  describe('Admin Settings Expanded Active', () => {
    it('should return true for Interface section on defaults page', () => {
      component.label = AdminPanelSections.Interface;
      setUrl('/admin/defaults');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });

    it('should return true for Interface section on limits page', () => {
      component.label = AdminPanelSections.Interface;
      setUrl('/admin/limits');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });

    it('should return true for Interface section on customization page', () => {
      component.label = AdminPanelSections.Interface;
      setUrl('/admin/customization');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });

    it('should return true for Interface section on announcements page', () => {
      component.label = AdminPanelSections.Interface;
      setUrl('/admin/announcements');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });

    it('should return true for ManageResources section on datacenters page', () => {
      component.label = AdminPanelSections.ManageResources;
      setUrl('/admin/datacenters');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });

    it('should return true for Monitoring section on rule-groups page', () => {
      component.label = AdminPanelSections.Monitoring;
      setUrl('/admin/rule-groups');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });

    it('should return true for Users section on accounts page', () => {
      component.label = AdminPanelSections.Users;
      setUrl('/admin/accounts');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });

    it('should return true for Users section on administrators page', () => {
      component.label = AdminPanelSections.Users;
      setUrl('/admin/administrators');
      expect(component.isAdminSettingsExpandedActive()).toBe(true);
    });
  });

  describe('isExpandedActive', () => {
    it('should return false when not in projects or settings routes', () => {
      setUrl('/dashboard');
      component.label = ProjectSidenavSection.Resources;
      expect(component.isExpandedActive()).toBe(false);
    });

    it('should call isProjectExpandedActive when url includes projects', () => {
      setUrl('/projects/test-project/clusters');
      component.label = ProjectSidenavSection.Resources;
      spyOn(component, 'isProjectExpandedActive').and.returnValue(true);

      component.isExpandedActive();

      expect(component.isProjectExpandedActive).toHaveBeenCalled();
    });

    it('should call isAdminSettingsExpandedActive when url includes settings', () => {
      setUrl('/settings/defaults');
      component.label = AdminPanelSections.Interface;
      spyOn(component, 'isAdminSettingsExpandedActive').and.returnValue(true);

      component.isExpandedActive();

      expect(component.isAdminSettingsExpandedActive).toHaveBeenCalled();
    });
  });

  describe('Click Handler', () => {
    it('should toggle expanded on click', () => {
      component['_expanded'] = false;
      spyOn(component, 'isExpandedActive').and.returnValue(false);

      component.onClick();

      expect(component.expanded).toBe(true);
    });

    it('should keep expanded true if isExpandedActive returns true', () => {
      component['_expanded'] = false;
      spyOn(component, 'isExpandedActive').and.returnValue(true);

      component.onClick();

      expect(component.expanded).toBe(true);
    });

    it('should set expanded to true when currently expanded and clicking', () => {
      component['_expanded'] = true;
      spyOn(component, 'isExpandedActive').and.returnValue(false);

      component.onClick();

      expect(component.expanded).toBe(false);
    });

    it('should toggle between expanded states on consecutive clicks', () => {
      component['_expanded'] = false;
      spyOn(component, 'isExpandedActive').and.returnValue(false);

      component.onClick();
      expect(component.expanded).toBe(true);

      component.onClick();
      expect(component.expanded).toBe(false);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngAfterViewChecked', () => {
      component.label = ProjectSidenavSection.Resources;
      component.ngOnInit();

      spyOn(component, 'isExpandedActive').and.returnValue(true);

      component.ngAfterViewChecked();

      expect(component['_expanded']).toBe(true);
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should trigger change detection in ngAfterViewChecked', () => {
      component.ngAfterViewChecked();

      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should expand when isExpandedActive returns true in ngAfterViewChecked', () => {
      component['_expanded'] = false;
      spyOn(component, 'isExpandedActive').and.returnValue(true);

      component.ngAfterViewChecked();

      expect(component.expanded).toBe(true);
    });

    it('should not collapse when isExpandedActive returns false if already expanded', () => {
      component['_expanded'] = true;
      spyOn(component, 'isExpandedActive').and.returnValue(false);

      component.ngAfterViewChecked();

      expect(component.expanded).toBe(true);
    });
  });

  describe('Wizard Mode Handling', () => {
    it('should check clusters url with user cluster wizard mode', () => {
      setUrl('/projects/test-project/wizard');
      window.history.state = {mode: WizardMode.CreateUserCluster};

      expect(component.checkUrl(View.Clusters)).toBe(true);
    });

    it('should check clusters url with undefined mode (defaults to user cluster)', () => {
      setUrl('/projects/test-project/wizard');
      window.history.state = {};

      expect(component.checkUrl(View.Clusters)).toBe(true);
    });

    it('should return false for clusters url with different wizard mode', () => {
      setUrl('/projects/test-project/wizard');
      window.history.state = {mode: 'different-mode'};

      expect(component.checkUrl(View.Clusters)).toBe(false);
    });

    it('should check external cluster wizard', () => {
      setUrl('/projects/test-project/external-cluster-wizard');
      expect(component.checkUrl(View.ExternalClusters)).toBe(true);
    });

    it('should check kubevirt cluster wizard', () => {
      setUrl('/projects/test-project/kubevirt-wizard');
      expect(component.checkUrl(View.KubeOneClusters)).toBe(true);
    });
  });

  describe('Complex URL Patterns', () => {
    it('should handle deep nested urls', () => {
      setUrl('/projects/my-project/clusters/cluster-123/nodes');
      expect(component.checkUrl(View.Clusters)).toBe(true);
    });

    it('should handle admin urls with multiple segments', () => {
      setUrl('/settings/datacenters/datacenter-1/providers');
      expect(component.checkUrl(AdminPanelView.Datacenters)).toBe(true);
    });

    it('should distinguish between different cluster types in url', () => {
      setUrl('/projects/test-project/external-clusters');
      expect(component.checkUrl(View.Clusters)).toBe(false);
      expect(component.checkUrl(View.ExternalClusters)).toBe(true);
    });
  });

  describe('Enum Values', () => {
    it('should expose ProjectSidenavSection enum', () => {
      expect(component.projectSidenavSections).toBe(ProjectSidenavSection);
    });

    it('should expose AdminPanelSections enum', () => {
      expect(component.adminPanelSections).toBe(AdminPanelSections);
    });

    it('should expose AdminPanelView enum', () => {
      expect(component.adminPanelView).toBe(AdminPanelView);
    });

    it('should expose View enum', () => {
      expect(component.view).toBe(View);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty url', () => {
      setUrl('');
      expect(component.checkUrl(View.Clusters)).toBe(false);
    });

    it('should handle url with trailing slash', () => {
      setUrl('/projects/test-project/clusters/');
      expect(component.checkUrl(View.Clusters)).toBe(true);
    });

    it('should handle case-sensitive url matching', () => {
      setUrl('/projects/test-project/Clusters');
      expect(component.checkUrl(View.Clusters)).toBe(false);
    });

    it('should return false for undefined label in project expanded active', () => {
      component.label = undefined as any;
      setUrl('/projects/test-project/clusters');
      expect(component.isProjectExpandedActive()).toBe(false);
    });

    it('should return false for undefined label in admin expanded active', () => {
      component.label = undefined as any;
      setUrl('/settings/defaults');
      expect(component.isAdminSettingsExpandedActive()).toBe(false);
    });
  });

  // Helper function to set URL
  function setUrl(url: string): void {
    Object.defineProperty(router.routerState, 'snapshot', {
      value: {
        url: url,
      },
      configurable: true,
    });
  }
});
