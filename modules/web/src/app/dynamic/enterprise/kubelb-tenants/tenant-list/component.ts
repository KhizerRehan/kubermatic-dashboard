//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0")
//                   Copyright © 2025 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {TenantService} from '@core/services/tenant';
import {KubeLBTenant} from '@shared/entity/kubelb';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Column {
  Name = 'name',
  Seed = 'seed',
  LoadBalancer = 'loadBalancer',
  Ingress = 'ingress',
  GatewayAPI = 'gatewayAPI',
}

@Component({
  selector: 'km-tenant-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class TenantListComponent implements OnInit, OnDestroy {
  readonly Column = Column;
  tenants: KubeLBTenant[] = [];
  dataSource = new MatTableDataSource<KubeLBTenant>();
  displayedColumns: string[] = Object.values(Column);
  showAll = false;
  isLoading = true;
  errors: string[] = [];
  seeds: string[] = [];
  selectedSeed = '';
  searchTerm = '';

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _tenantService: TenantService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _datacenterService: DatacenterService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.tenants || [];
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = Column.Name;
    this.sort.direction = 'asc';

    this.dataSource.filterPredicate = this._filter.bind(this);
    this.dataSource.filter = '';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._datacenterService.seeds.pipe(takeUntil(this._unsubscribe)).subscribe(seeds => {
      this.seeds = seeds;
      if (seeds.length > 0) {
        this.selectedSeed = seeds[0]; // Default to 'shared' seed.
        this._loadTenants();
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSeedChange(): void {
    this._loadTenants();
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
    this._loadTenants();
  }

  getFeatureStatus(enabled: boolean): string {
    return enabled ? 'Enabled' : 'Disabled';
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isPaginatorVisible(): boolean {
    return !this.isLoading && this.tenants && this.tenants.length > 0;
  }

  private _loadTenants(): void {
    if (!this.selectedSeed) {
      return;
    }

    this.isLoading = true;
    this._tenantService
      .listTenants(this.selectedSeed, this.showAll)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: response => {
          this.tenants = response.tenants;
          this.errors = response.errors;
          this.dataSource.data = this.tenants;
          this.isLoading = false;
        },
        error: error => {
          this._notificationService.error(`Failed to load tenants: ${error.message}`);
          this.isLoading = false;
        },
      });
  }

  private _filter(data: KubeLBTenant, filter: string): boolean {
    if (!filter) {
      return true;
    }
    return data.name.toLowerCase().includes(filter.toLowerCase());
  }
}
