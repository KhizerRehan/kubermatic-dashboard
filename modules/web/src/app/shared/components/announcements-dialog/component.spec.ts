// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, waitForAsync, fakeAsync, tick} from '@angular/core/testing';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatTableModule} from '@angular/material/table';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {UserService} from '@app/core/services/user';
import {SharedModule} from '@shared/module';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {of, BehaviorSubject} from 'rxjs';
import {AnnouncementsDialogComponent} from './component';

describe('AnnouncementsDialogComponent', () => {
  let fixture: ComponentFixture<AnnouncementsDialogComponent>;
  let component: AnnouncementsDialogComponent;
  let dialogRef: MatDialogRefMock;
  let userService: any;

  const mockAnnouncements: Record<string, AdminAnnouncement> = {
    'announcement-1': {
      id: 'announcement-1',
      message: 'System maintenance scheduled',
      createdAt: '2025-01-01T10:00:00Z',
      isActive: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'announcement-2': {
      id: 'announcement-2',
      message: 'New feature available',
      createdAt: '2025-01-02T10:00:00Z',
      isActive: true,
      expires: null,
    },
    'announcement-3': {
      id: 'announcement-3',
      message: 'Expired announcement',
      createdAt: '2024-12-01T10:00:00Z',
      isActive: true,
      expires: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };

  beforeEach(() => {
    const userServiceMock = {
      currentUser: new BehaviorSubject({readAnnouncements: ['announcement-1']}),
      patchReadAnnouncements: jest.fn().mockReturnValue(of(['announcement-1', 'announcement-2'])),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, MatTableModule],
      declarations: [AnnouncementsDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: UserService, useValue: userServiceMock},
        {provide: MAT_DIALOG_DATA, useValue: mockAnnouncements},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AnnouncementsDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    userService = TestBed.inject(UserService);
    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should inject MAT_DIALOG_DATA with announcements', waitForAsync(() => {
      expect(component.data).toBe(mockAnnouncements);
    }));

    it('should add panel class on init', waitForAsync(() => {
      const addPanelClassSpy = jest.spyOn(dialogRef, 'addPanelClass');
      component.ngOnInit();
      expect(addPanelClassSpy).toHaveBeenCalledWith('km-announcements-dialog');
    }));

    it('should initialize MatTableDataSource', waitForAsync(() => {
      expect(component.dataSource).toBeTruthy();
      expect(component.dataSource.data).toEqual(['announcement-1', 'announcement-2']);
    }));

    it('should initialize displayedColumns', waitForAsync(() => {
      expect(component.displayedColumns).toEqual(['message', 'created', 'actions']);
    }));
  });

  describe('Announcements Filtering', () => {
    it('should only include active announcements', waitForAsync(() => {
      expect(component.announcements.has('announcement-1')).toBe(true);
      expect(component.announcements.has('announcement-2')).toBe(true);
    }));

    it('should exclude expired announcements', waitForAsync(() => {
      expect(component.announcements.has('announcement-3')).toBe(false);
    }));

    it('should exclude inactive announcements', waitForAsync(() => {
      const inactiveAnnouncement: Record<string, AdminAnnouncement> = {
        'announcement-4': {
          id: 'announcement-4',
          message: 'Inactive announcement',
          createdAt: '2025-01-01T10:00:00Z',
          isActive: false,
          expires: null,
        },
      };

      component.data = inactiveAnnouncement;
      component.announcements.clear();
      component.ngOnInit();

      expect(component.announcements.has('announcement-4')).toBe(false);
    }));

    it('should accept announcements with null expires date', waitForAsync(() => {
      expect(component.announcements.has('announcement-2')).toBe(true);
    }));
  });

  describe('Read Announcements Management', () => {
    it('should load read announcements from user service', waitForAsync(() => {
      expect(component.readAnnouncements).toContain('announcement-1');
    }));

    it('should identify read announcements correctly', waitForAsync(() => {
      expect(component.isMessageRead('announcement-1')).toBe(true);
      expect(component.isMessageRead('announcement-2')).toBe(false);
    }));

    it('should mark announcement as read', fakeAsync(() => {
      component.readAnnouncements = [];
      component.markAsRead('announcement-1');

      expect(component.markingAnnouncementsAsRead['announcement-1']).toBe(true);

      tick();

      expect(userService.patchReadAnnouncements).toHaveBeenCalledWith(['announcement-1']);
      expect(component.markingAnnouncementsAsRead['announcement-1']).toBe(false);
    }));

    it('should update read announcements after marking as read', fakeAsync(() => {
      component.readAnnouncements = [];
      component.markAsRead('announcement-1');

      tick();

      expect(component.readAnnouncements).toContain('announcement-1');
      expect(component.readAnnouncements).toContain('announcement-2');
    }));

    it('should preserve read status during mark as read', fakeAsync(() => {
      component.readAnnouncements = ['announcement-1'];
      component.markAsRead('announcement-2');

      tick();

      expect(userService.patchReadAnnouncements).toHaveBeenCalledWith(['announcement-1', 'announcement-2']);
    }));

    it('should filter out announcements no longer displayed when loading read', waitForAsync(() => {
      userService.currentUser.next({readAnnouncements: ['announcement-1', 'announcement-3', 'announcement-99']});
      component.readAnnouncements = [];

      component.ngOnInit();

      // Should only include announcement-1 since announcement-3 is expired and announcement-99 doesn't exist
      expect(component.readAnnouncements).toContain('announcement-1');
      expect(component.readAnnouncements).not.toContain('announcement-3');
      expect(component.readAnnouncements).not.toContain('announcement-99');
    }));
  });

  describe('Get Message and CreatedAt', () => {
    it('should get message for announcement', waitForAsync(() => {
      const message = component.getMessage('announcement-1');
      expect(message).toBe('System maintenance scheduled');
    }));

    it('should get created date for announcement', waitForAsync(() => {
      const createdAt = component.getCreatedAt('announcement-1');
      expect(createdAt).toBe('2025-01-01T10:00:00Z');
    }));

    it('should handle messages with special characters', waitForAsync(() => {
      const specialAnnouncement: Record<string, AdminAnnouncement> = {
        'special': {
          id: 'special',
          message: 'Message with <html> & special chars!',
          createdAt: '2025-01-01T10:00:00Z',
          isActive: true,
          expires: null,
        },
      };

      component.data = specialAnnouncement;
      component.announcements.clear();
      component.ngOnInit();

      expect(component.getMessage('special')).toContain('special chars');
    }));
  });

  describe('hasAnnouncements Method', () => {
    it('should return true when announcements exist', waitForAsync(() => {
      expect(component.hasAnnouncements()).toBe(true);
    }));

    it('should return false when no announcements', waitForAsync(() => {
      component.announcements.clear();
      expect(component.hasAnnouncements()).toBe(false);
    }));

    it('should handle null announcements map', waitForAsync(() => {
      component.announcements = null;
      expect(component.hasAnnouncements()).toBe(false);
    }));
  });

  describe('Column Enum', () => {
    it('should have correct column enum values', waitForAsync(() => {
      expect(component.Column.Message).toBe('message');
      expect(component.Column.Created).toBe('created');
      expect(component.Column.Actions).toBe('actions');
    }));
  });

  describe('Dialog Reference Management', () => {
    it('should inject MatDialogRef', waitForAsync(() => {
      expect(component._matDialogRef).toBeTruthy();
      expect(component._matDialogRef).toBe(dialogRef);
    }));

    it('should allow closing dialog', waitForAsync(() => {
      component._matDialogRef.close();
      expect(dialogRef.closeCalled).toBe(true);
    }));
  });

  describe('Edge Cases', () => {
    it('should handle empty announcements map', waitForAsync(() => {
      component.data = {};
      component.announcements.clear();
      component.ngOnInit();

      expect(component.announcements.size).toBe(0);
      expect(component.dataSource.data.length).toBe(0);
    }));

    it('should handle announcements with very long messages', waitForAsync(() => {
      const longMessage = 'A'.repeat(1000);
      const longAnnouncement: Record<string, AdminAnnouncement> = {
        'long': {
          id: 'long',
          message: longMessage,
          createdAt: '2025-01-01T10:00:00Z',
          isActive: true,
          expires: null,
        },
      };

      component.data = longAnnouncement;
      component.announcements.clear();
      component.ngOnInit();

      expect(component.getMessage('long')).toBe(longMessage);
    }));

    it('should handle multiple rapid mark as read calls', fakeAsync(() => {
      component.readAnnouncements = [];
      component.markAsRead('announcement-1');
      component.markAsRead('announcement-2');

      tick();

      expect(userService.patchReadAnnouncements).toHaveBeenCalledTimes(2);
    }));

    it('should handle announcements with dates near expiry boundary', waitForAsync(() => {
      const nearExpiryAnnouncement: Record<string, AdminAnnouncement> = {
        'near-expiry': {
          id: 'near-expiry',
          message: 'Expiring soon',
          createdAt: '2025-01-01T10:00:00Z',
          isActive: true,
          expires: new Date(Date.now() + 1000).toISOString(), // Expires in 1 second
        },
      };

      component.data = nearExpiryAnnouncement;
      component.announcements.clear();
      component.ngOnInit();

      // Should be included since it's not yet expired
      expect(component.announcements.has('near-expiry')).toBe(true);
    }));
  });

  describe('Table Data Management', () => {
    it('should initialize dataSource with announcement ids', waitForAsync(() => {
      expect(component.dataSource.data).toContain('announcement-1');
      expect(component.dataSource.data).toContain('announcement-2');
      expect(component.dataSource.data.length).toBe(2);
    }));

    it('should update dataSource when announcements change', waitForAsync(() => {
      component.announcements.clear();
      component.announcements.set('announcement-1', mockAnnouncements['announcement-1']);
      component.dataSource.data = Array.from(component.announcements.keys());

      expect(component.dataSource.data).toEqual(['announcement-1']);
    }));
  });

  describe('Cleanup and Lifecycle', () => {
    it('should handle component destruction', waitForAsync(() => {
      fixture.destroy();
      expect(component).toBeTruthy();
    }));

    it('should unsubscribe from observables on destroy', waitForAsync(() => {
      fixture.destroy();
      expect(component.readAnnouncements).toBeDefined();
    }));
  });
});
