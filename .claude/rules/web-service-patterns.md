---
globs: modules/web/src/app/core/services/**/*
---

# Web Module — Service Patterns

All singleton services live in `src/app/core/services/`. Follow these patterns.

## Service Declaration

- Always use `@Injectable({ providedIn: 'root' })`
- One service per file
- Provider-specific services in `core/services/provider/` — one per cloud provider

## State Management

- Use `BehaviorSubject<T>` for state that has a current value
- Use `Subject<T>` for event streams (no initial value)
- Expose state as `Observable` via getter — never expose the Subject directly

```ts
// Correct
private readonly _currentUser$ = new BehaviorSubject<Member>(undefined);
get currentUser(): Observable<Member> {
  return this._currentUser$.pipe(filter(user => !!user));
}

// Wrong — never expose Subject
public currentUser$ = new BehaviorSubject<Member>(undefined);
```

## Subscription Cleanup

Use `takeUntil` pattern with a destroy Subject:

```ts
private _unsubscribe = new Subject<void>();

ngOnDestroy(): void {
  this._unsubscribe.next();
  this._unsubscribe.complete();
}

// In subscriptions:
this.someObservable$.pipe(takeUntil(this._unsubscribe)).subscribe(...);
```

Never use manual subscription arrays. Never leave subscriptions unmanaged.

## HTTP Caching Pattern

Cache observables keyed by resource ID using `Map` + `shareReplay`:

```ts
private _cache$ = new Map<string, Observable<Resource>>();

getResource(id: string): Observable<Resource> {
  if (!this._cache$.get(id)) {
    const resource$ = merge(this._onUpdate, this._refreshTimer$).pipe(
      switchMapTo(this._http.get<Resource>(`${this._restRoot}/${id}`)),
      shareReplay({refCount: true, bufferSize: 1})
    );
    this._cache$.set(id, resource$);
  }
  return this._cache$.get(id);
}
```

## Refresh Pattern

Combine timer with manual trigger:

```ts
private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);
private _onUpdate = new Subject<void>();
```

## Error Handling

- Use `NotificationService` for user-facing errors — queue-based, deduplicates, dispatches via Material SnackBar
- Use `catchError()` operator with fallback Observables
- Do not use `try/catch` around Observable chains

## RxJS Operator Rules

- No nested subscriptions — use `switchMap()` or `mergeMap()`
- Use `take(1)` instead of `first()` (ESLint enforced)
- Use `debounceTime()` on form value subscriptions
- Use `distinctUntilChanged()` to prevent redundant emissions
