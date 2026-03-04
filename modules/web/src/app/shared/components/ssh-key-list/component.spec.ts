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
import {SharedModule} from '@shared/module';
import {SSHKey} from '@shared/entity/ssh-key';
import {SSHKeyListComponent} from './component';

describe('SSHKeyListComponent', () => {
  let fixture: ComponentFixture<SSHKeyListComponent>;
  let component: SSHKeyListComponent;

  const mockSSHKeys: SSHKey[] = [
    {name: 'key-1'} as SSHKey,
    {name: 'key-2'} as SSHKey,
    {name: 'key-3'} as SSHKey,
    {name: 'key-4'} as SSHKey,
    {name: 'key-5'} as SSHKey,
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyListComponent);
    component = fixture.componentInstance;
  });

  it('should initialize component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display SSH keys up to maxDisplayed limit', () => {
    component.sshKeys = mockSSHKeys;
    component.maxDisplayed = 3;
    fixture.detectChanges();

    const displayed = component.getDisplayed();
    expect(displayed).toBe('key-1, key-2, key-3');
  });

  it('should display default number of SSH keys (3)', () => {
    component.sshKeys = mockSSHKeys;
    fixture.detectChanges();

    const displayed = component.getDisplayed();
    expect(displayed).toBe('key-1, key-2, key-3');
  });

  it('should return empty string when no SSH keys present', () => {
    component.sshKeys = [];
    fixture.detectChanges();

    const displayed = component.getDisplayed();
    expect(displayed).toBe('');
  });

  it('should return all keys when count is less than maxDisplayed', () => {
    component.sshKeys = [{name: 'key-1'} as SSHKey, {name: 'key-2'} as SSHKey];
    component.maxDisplayed = 5;
    fixture.detectChanges();

    const displayed = component.getDisplayed();
    expect(displayed).toBe('key-1, key-2');
  });

  it('should return truncated keys beyond maxDisplayed limit', () => {
    component.sshKeys = mockSSHKeys;
    component.maxDisplayed = 2;
    fixture.detectChanges();

    const truncated = component.getTruncatedSSHKeys();
    expect(truncated).toBe('key-3, key-4, key-5');
  });

  it('should return empty string for truncated when all keys are displayed', () => {
    component.sshKeys = mockSSHKeys;
    component.maxDisplayed = 10;
    fixture.detectChanges();

    const truncated = component.getTruncatedSSHKeys();
    expect(truncated).toBe('');
  });

  it('should update displayed keys when sshKeys input changes', () => {
    component.sshKeys = [{name: 'key-1'} as SSHKey, {name: 'key-2'} as SSHKey];
    fixture.detectChanges();
    expect(component.getDisplayed()).toBe('key-1, key-2');

    component.sshKeys = mockSSHKeys;
    fixture.detectChanges();
    expect(component.getDisplayed()).toBe('key-1, key-2, key-3');
  });

  it('should update maxDisplayed and reflect in displayed keys', () => {
    component.sshKeys = mockSSHKeys;
    component.maxDisplayed = 3;
    fixture.detectChanges();
    expect(component.getDisplayed()).toBe('key-1, key-2, key-3');

    component.maxDisplayed = 2;
    fixture.detectChanges();
    expect(component.getDisplayed()).toBe('key-1, key-2');
  });
});
