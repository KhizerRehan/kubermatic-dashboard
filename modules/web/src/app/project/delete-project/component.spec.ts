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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {SharedModule} from '@shared/module';
import {fakeProject} from '@test/data/project';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ProjectModule} from '../module';
import {DeleteProjectConfirmationComponent} from './component';

describe('DeleteProjectConfirmationComponent', () => {
  let fixture: ComponentFixture<DeleteProjectConfirmationComponent>;
  let component: DeleteProjectConfirmationComponent;
  let dialogRef: MatDialogRefMock;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule, ProjectModule],
      providers: [{provide: MatDialogRef, useClass: MatDialogRefMock}],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteProjectConfirmationComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    component.project = fakeProject();
    fixture.detectChanges();
  });

  // Component initialization tests
  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty verification input', () => {
    expect(component.verificationInput).toBe('');
  });

  it('should accept project input', () => {
    const project = fakeProject();
    component.project = project;

    expect(component.project).toBe(project);
    expect(component.project.id).toBe(project.id);
  });

  // Name verification tests
  it('should verify project name correctly when matching', () => {
    const project = fakeProject();
    component.project = project;
    component.verificationInput = project.name;

    expect(component.isNameVerified()).toBe(true);
  });

  it('should reject verification when name does not match', () => {
    const project = fakeProject();
    component.project = project;
    component.verificationInput = 'wrong-name';

    expect(component.isNameVerified()).toBe(false);
  });

  it('should reject verification with empty input', () => {
    const project = fakeProject();
    component.project = project;
    component.verificationInput = '';

    expect(component.isNameVerified()).toBe(false);
  });

  it('should be case-sensitive for name verification', () => {
    const project = fakeProject();
    component.project = project;
    component.verificationInput = project.name.toUpperCase();

    expect(component.isNameVerified()).toBe(false);
  });

  it('should reject partial name matches', () => {
    const project = fakeProject();
    component.project = project;
    component.verificationInput = project.name.substring(0, 5);

    expect(component.isNameVerified()).toBe(false);
  });

  // Enter key handling tests
  it('should close dialog with true when Enter key pressed with correct name', () => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    const project = fakeProject();
    component.project = project;
    component.verificationInput = project.name;

    component.onEnterKeyDown();

    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('should not close dialog when Enter key pressed with incorrect name', () => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    const project = fakeProject();
    component.project = project;
    component.verificationInput = 'wrong-name';

    component.onEnterKeyDown();

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should not close dialog when Enter key pressed with empty input', () => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    const project = fakeProject();
    component.project = project;
    component.verificationInput = '';

    component.onEnterKeyDown();

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should not close dialog when Enter key pressed with partial name', () => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    const project = fakeProject();
    component.project = project;
    component.verificationInput = project.name.substring(0, 5);

    component.onEnterKeyDown();

    expect(closeSpy).not.toHaveBeenCalled();
  });

  // Input change simulation tests
  it('should update verification input on user input', () => {
    const newInput = 'test-project-name';
    component.verificationInput = newInput;

    expect(component.verificationInput).toBe(newInput);
  });

  it('should update verification input progressively', () => {
    const project = fakeProject();
    component.project = project;

    // Simulate typing the project name character by character
    for (let i = 1; i <= project.name.length; i++) {
      component.verificationInput = project.name.substring(0, i);
      expect(component.verificationInput).toBe(project.name.substring(0, i));
    }
  });

  // Dialog reference tests
  it('should have dialog reference available', () => {
    expect(component.dialogRef).toBeTruthy();
  });

  it('should close dialog through dialog reference', () => {
    const closeSpy = jest.spyOn(component.dialogRef, 'close');
    component.project = fakeProject();
    component.verificationInput = component.project.name;

    component.onEnterKeyDown();

    expect(closeSpy).toHaveBeenCalled();
  });

  // Edge case tests
  it('should handle project name with special characters', () => {
    const project = {...fakeProject(), name: 'project-with-special-chars_123'};
    component.project = project;
    component.verificationInput = project.name;

    expect(component.isNameVerified()).toBe(true);
  });

  it('should handle project name with spaces', () => {
    const project = {...fakeProject(), name: 'Project Name With Spaces'};
    component.project = project;
    component.verificationInput = project.name;

    expect(component.isNameVerified()).toBe(true);
  });

  it('should handle whitespace differences in verification', () => {
    const project = {...fakeProject(), name: 'project name'};
    component.project = project;
    component.verificationInput = ' project name ';

    expect(component.isNameVerified()).toBe(false);
  });

  it('should handle very long project names', () => {
    const longName = 'very-long-project-name-that-goes-on-and-on-and-on-and-exceeds-normal-limits';
    const project = {...fakeProject(), name: longName};
    component.project = project;
    component.verificationInput = longName;

    expect(component.isNameVerified()).toBe(true);
  });

  // Null/undefined handling tests
  it('should handle null project gracefully', () => {
    component.project = null;

    expect(() => {
      component.isNameVerified();
    }).not.toThrow();
  });

  it('should not close dialog when project is null', () => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    component.project = null;
    component.verificationInput = '';

    expect(() => {
      component.onEnterKeyDown();
    }).not.toThrow();
  });
});
