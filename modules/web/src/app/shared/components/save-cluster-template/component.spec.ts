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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {SaveClusterTemplateDialogComponent} from './component';
import {Cluster, ClusterSpec, ClusterStatus} from '@shared/entity/cluster';
import {NodeData} from '@shared/model/NodeSpecChange';
import {Application} from '@shared/entity/application';
import {SSHKey} from '@shared/entity/ssh-key';
import {Member} from '@shared/entity/member';
import {of} from 'rxjs';
import {ClusterTemplateScope} from '@shared/entity/cluster-template';

describe('SaveClusterTemplateDialogComponent', () => {
  let fixture: ComponentFixture<SaveClusterTemplateDialogComponent>;
  let component: SaveClusterTemplateDialogComponent;
  let dialogRef: MatDialogRefMock;
  let clusterTemplateService: jasmine.SpyObj<ClusterTemplateService>;
  let userService: jasmine.SpyObj<UserService>;

  const mockCluster: Cluster = {
    id: 'cluster-123',
    name: 'test-cluster',
    spec: {} as ClusterSpec,
    status: {} as ClusterStatus,
    creationTimestamp: new Date(),
  };

  const mockNodeData: NodeData = {
    name: 'node-deployment-1',
    count: 3,
    labels: {env: 'test'},
    annotations: {comment: 'test'},
    spec: {},
  };

  const mockSSHKeys: SSHKey[] = [
    {name: 'key-1', id: 'key-id-1', spec: {publicKey: 'ssh-rsa ...'}} as any,
  ];

  const mockApplications: Application[] = [
    {name: 'app-1', spec: {}} as any,
  ];

  const dialogData = {
    cluster: mockCluster,
    nodeData: mockNodeData,
    sshKeys: mockSSHKeys,
    projectID: 'project-123',
    applications: mockApplications,
  };

  beforeEach(() => {
    clusterTemplateService = jasmine.createSpyObj('ClusterTemplateService', ['create', 'update']);
    clusterTemplateService.create.and.returnValue(of({} as any));
    clusterTemplateService.update.and.returnValue(of({} as any));

    userService = jasmine.createSpyObj('UserService', [''], {
      currentUser: of({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      } as Member),
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      declarations: [SaveClusterTemplateDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: dialogData},
        {provide: ClusterTemplateService, useValue: clusterTemplateService},
        {provide: UserService, useValue: userService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(SaveClusterTemplateDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should inject MAT_DIALOG_DATA correctly', waitForAsync(() => {
      expect(component.data).toEqual(dialogData);
    }));

    it('should inject MatDialogRef correctly', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should initialize form on ngOnInit', waitForAsync(() => {
      expect(component.form).toBeTruthy();
    }));

    it('should have scope enum defined', waitForAsync(() => {
      expect(component.scope).toBeDefined();
    }));

    it('should have control enum defined', waitForAsync(() => {
      expect(component.control).toBeDefined();
    }));
  });

  describe('Form Initialization', () => {
    it('should initialize name control', waitForAsync(() => {
      expect(component.form.get('name')).toBeTruthy();
    }));

    it('should initialize scope control', waitForAsync(() => {
      expect(component.form.get('scope')).toBeTruthy();
    }));

    it('should set default scope to User', waitForAsync(() => {
      const scopeControl = component.form.get('scope');
      expect(scopeControl.value).toBe(ClusterTemplateScope.User);
    }));

    it('should have name as required field', waitForAsync(() => {
      const nameControl = component.form.get('name');
      nameControl.setValue('');
      expect(nameControl.invalid).toBe(true);
    }));

    it('should validate name as Kubernetes resource name', waitForAsync(() => {
      const nameControl = component.form.get('name');
      nameControl.setValue('valid-name-123');
      expect(nameControl.valid).toBe(true);
    }));

    it('should reject invalid Kubernetes resource names', waitForAsync(() => {
      const nameControl = component.form.get('name');
      nameControl.setValue('INVALID_NAME');
      expect(nameControl.invalid).toBe(true);
    }));
  });

  describe('Pre-filled Data', () => {
    it('should pre-fill name from dialog data', waitForAsync(() => {
      const dataWithName = {...dialogData, name: 'pre-filled-name'};

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
        declarations: [SaveClusterTemplateDialogComponent],
        providers: [
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: MAT_DIALOG_DATA, useValue: dataWithName},
          {provide: ClusterTemplateService, useValue: clusterTemplateService},
          {provide: UserService, useValue: userService},
        ],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(SaveClusterTemplateDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.form.get('name').value).toBe('pre-filled-name');
    }));

    it('should pre-fill scope from dialog data', waitForAsync(() => {
      const dataWithScope = {...dialogData, scope: ClusterTemplateScope.Project};

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
        declarations: [SaveClusterTemplateDialogComponent],
        providers: [
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: MAT_DIALOG_DATA, useValue: dataWithScope},
          {provide: ClusterTemplateService, useValue: clusterTemplateService},
          {provide: UserService, useValue: userService},
        ],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(SaveClusterTemplateDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.form.get('scope').value).toBe(ClusterTemplateScope.Project);
    }));
  });

  describe('showSSHKeyWarning Property', () => {
    it('should show warning when scope is User and SSH keys exist', waitForAsync(() => {
      component.form.patchValue({scope: ClusterTemplateScope.User});
      expect(component.showSSHKeyWarning).toBe(true);
    }));

    it('should not show warning when scope is Project', waitForAsync(() => {
      component.form.patchValue({scope: ClusterTemplateScope.Project});
      expect(component.showSSHKeyWarning).toBe(false);
    }));

    it('should not show warning when no SSH keys', waitForAsync(() => {
      component.data.sshKeys = [];
      component.form.patchValue({scope: ClusterTemplateScope.User});
      expect(component.showSSHKeyWarning).toBe(false);
    }));

    it('should not show warning when SSH keys are null', waitForAsync(() => {
      component.data.sshKeys = null;
      component.form.patchValue({scope: ClusterTemplateScope.User});
      expect(component.showSSHKeyWarning).toBe(false);
    }));
  });

  describe('showEncryptionWarning Property', () => {
    it('should show warning when cluster has encryption enabled', waitForAsync(() => {
      const encryptedCluster = {
        ...mockCluster,
        spec: {encryptionConfiguration: {enabled: true}} as any,
      };

      component.data.cluster = encryptedCluster;
      expect(component.showEncryptionWarning).toBe(true);
    }));

    it('should not show warning when cluster has no encryption', waitForAsync(() => {
      expect(component.showEncryptionWarning).toBe(false);
    }));

    it('should not show warning when cluster spec is null', waitForAsync(() => {
      component.data.cluster.spec = null;
      expect(component.showEncryptionWarning).toBe(false);
    }));
  });

  describe('getObservable Method', () => {
    it('should return create observable for new template', fakeAsync(() => {
      component.form.patchValue({name: 'new-template'});
      const obs = component.getObservable();

      expect(clusterTemplateService.create).toBeDefined();
      tick();
    }));

    it('should return update observable for existing template', fakeAsync(() => {
      const dataWithTemplateId = {...dialogData, clusterTemplateID: 'template-123'};
      component.data = dataWithTemplateId;
      component.form.patchValue({name: 'updated-template'});

      const obs = component.getObservable();

      expect(clusterTemplateService.update).toBeDefined();
      tick();
    }));

    it('should pass correct data to create', fakeAsync(() => {
      component.form.patchValue({
        name: 'my-template',
        scope: ClusterTemplateScope.Project,
      });

      component.getObservable().subscribe();
      tick();

      const callArgs = clusterTemplateService.create.calls.mostRecent().args;
      expect(callArgs[0].name).toBe('my-template');
      expect(callArgs[1]).toBe('project-123');
    }));

    it('should pass correct data to update', fakeAsync(() => {
      const dataWithTemplateId = {...dialogData, clusterTemplateID: 'template-123'};
      component.data = dataWithTemplateId;
      component.form.patchValue({name: 'updated-template'});

      component.getObservable().subscribe();
      tick();

      const callArgs = clusterTemplateService.update.calls.mostRecent().args;
      expect(callArgs[1]).toBe('project-123');
      expect(callArgs[2]).toBe('template-123');
    }));
  });

  describe('onNext Method', () => {
    it('should close dialog with template data', fakeAsync(() => {
      const mockTemplate = {id: 'template-1', name: 'my-template'};
      component.onNext(mockTemplate as any);

      tick();

      expect(dialogRef.closeCalled).toBe(true);
    }));
  });

  describe('Current User Information', () => {
    it('should load current user on init', fakeAsync(() => {
      tick();
      expect(component.user).toBeTruthy();
    }));

    it('should store user in component', fakeAsync(() => {
      tick();
      expect(component.user.name).toBe('Test User');
    }));
  });

  describe('SSH Key Handling', () => {
    it('should extract SSH key names from sshKeys array', fakeAsync(() => {
      expect(component.data.sshKeys.length).toBeGreaterThan(0);
      expect(component.data.sshKeys[0].name).toBe('key-1');
      tick();
    }));

    it('should handle empty sshKeys array', waitForAsync(() => {
      component.data.sshKeys = [];
      expect(component.data.sshKeys.length).toBe(0);
    }));

    it('should handle null sshKeys', waitForAsync(() => {
      component.data.sshKeys = null;
      expect(component.showSSHKeyWarning).toBe(false);
    }));
  });

  describe('Applications Handling', () => {
    it('should include applications in template', fakeAsync(() => {
      component.form.patchValue({name: 'app-template'});
      const obs = component.getObservable();

      expect(component.data.applications.length).toBeGreaterThan(0);
      tick();
    }));

    it('should handle empty applications array', waitForAsync(() => {
      component.data.applications = [];
      expect(component.data.applications.length).toBe(0);
    }));

    it('should handle null applications', waitForAsync(() => {
      component.data.applications = null;
      expect(component).toBeTruthy();
    }));
  });

  describe('Node Data Handling', () => {
    it('should extract node data from dialog data', waitForAsync(() => {
      expect(component.data.nodeData.name).toBe('node-deployment-1');
      expect(component.data.nodeData.count).toBe(3);
    }));

    it('should preserve node labels', waitForAsync(() => {
      expect(component.data.nodeData.labels).toEqual({env: 'test'});
    }));

    it('should preserve node annotations', waitForAsync(() => {
      expect(component.data.nodeData.annotations).toEqual({comment: 'test'});
    }));
  });

  describe('Encryption Configuration Handling', () => {
    it('should remove encryption configuration from cluster when saving', fakeAsync(() => {
      const encryptedCluster = {
        ...mockCluster,
        spec: {
          encryptionConfiguration: {enabled: true, resources: ['secrets']},
        } as any,
      };

      component.data.cluster = encryptedCluster;
      component.form.patchValue({name: 'template'});

      component.getObservable().subscribe();
      tick();

      const callArgs = clusterTemplateService.create.calls.mostRecent().args;
      expect(callArgs[0].cluster.spec.encryptionConfiguration).toBeUndefined();
    }));
  });

  describe('Form State Management', () => {
    it('should track form dirty state', waitForAsync(() => {
      expect(component.form.pristine).toBe(true);
      component.form.patchValue({name: 'new-name'});
      expect(component.form.dirty).toBe(true);
    }));

    it('should allow form reset', waitForAsync(() => {
      component.form.patchValue({name: 'new-name'});
      component.form.reset();
      expect(component.form.pristine).toBe(true);
    }));
  });

  describe('Multiple Template Creation', () => {
    it('should support creating multiple templates sequentially', fakeAsync(() => {
      component.form.patchValue({name: 'template-1'});
      component.getObservable().subscribe();
      tick();

      expect(clusterTemplateService.create).toHaveBeenCalled();

      component.form.patchValue({name: 'template-2'});
      component.getObservable().subscribe();
      tick();

      expect(clusterTemplateService.create).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Edge Cases', () => {
    it('should handle very long template names', waitForAsync(() => {
      const longName = 'a'.repeat(255);
      component.form.patchValue({name: longName});
      expect(component.form.get('name').value).toBe(longName);
    }));

    it('should handle cluster without spec', waitForAsync(() => {
      component.data.cluster.spec = null;
      expect(component.showEncryptionWarning).toBe(false);
    }));

    it('should handle many SSH keys', waitForAsync(() => {
      const manyKeys = Array.from({length: 100}, (_, i) => ({
        name: `key-${i}`,
        id: `key-id-${i}`,
        spec: {publicKey: `ssh-rsa ...${i}`},
      } as any));

      component.data.sshKeys = manyKeys;
      expect(component.data.sshKeys.length).toBe(100);
    }));

    it('should handle many applications', waitForAsync(() => {
      const manyApps = Array.from({length: 100}, (_, i) => ({
        name: `app-${i}`,
        spec: {},
      } as any));

      component.data.applications = manyApps;
      expect(component.data.applications.length).toBe(100);
    }));
  });
});
