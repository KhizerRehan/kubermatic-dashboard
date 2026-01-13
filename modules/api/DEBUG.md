# Debugging Kubermatic API in VSCode

## Fixed Issues
✅ Fixed syntax errors in `.vscode/launch.json`:
- Removed extra 's' character on line 18
- Removed trailing commas that caused JSON parsing errors

## Quick Start

### 1. Using VSCode Debugger (Recommended for Breakpoints)

#### Prerequisites
- Install the [Go extension for VSCode](https://marketplace.visualstudio.com/items?itemName=golang.go)
- Make sure `dlv` (Delve debugger) is installed: `go install github.com/go-delve/delve/cmd/dlv@latest`
- Set your `KUBECONFIG` environment variable to point to your kubeconfig file

#### Steps to Debug:

1. **Open the project in VSCode**
   ```bash
   code /Users/mac/Work/Github/kubermatic/worktrees/wt-feat/advance-machine-selector
   ```

2. **Set breakpoints**
   - Open any Go file (e.g., `modules/api/cmd/kubermatic-api/main.go`)
   - Click in the gutter next to a line number to set a breakpoint (red dot will appear)

3. **Start debugging**
   - Press `F5` or go to "Run and Debug" panel (Cmd+Shift+D)
   - Select **"Launch API (EE)"** from the dropdown
   - Click the green play button or press `F5`

4. **Debug controls**
   - **F5**: Continue
   - **F10**: Step Over
   - **F11**: Step Into
   - **Shift+F11**: Step Out
   - **Shift+F5**: Stop Debugging
   - **Ctrl+Shift+F5**: Restart Debugging

#### Available Debug Configurations:

1. **Launch API (EE)** - Enterprise Edition
   - Port: 8080
   - PProf: 6600
   - Full debug logging enabled

2. **Launch API (CE)** - Community Edition
   - Port: 8080
   - PProf: 6601
   - Full debug logging enabled

### 2. Using the Debug Script (For Console Debugging)

If you just want to run with verbose logging without breakpoints:

```bash
cd /Users/mac/Work/Github/kubermatic/worktrees/wt-feat/advance-machine-selector/modules/api
./debug-api.sh
```

This will:
- Build the API with proper edition tags
- Run with `-log-debug=true` and `-v=4` for maximum logging
- Enable PProf on port 6600
- Run on port 8080

#### Customize with environment variables:

```bash
# Change ports
API_PORT=9090 PPROF_PORT=7700 ./debug-api.sh

# Use different kubeconfig
KUBECONFIG=/path/to/kubeconfig ./debug-api.sh

# Use Community Edition
KUBERMATIC_EDITION=ce ./debug-api.sh
```

## Troubleshooting

### VSCode Debugger Not Working

1. **Check if Delve is installed:**
   ```bash
   which dlv
   # If not found, install it:
   go install github.com/go-delve/delve/cmd/dlv@latest
   ```

2. **Verify KUBECONFIG is set:**
   ```bash
   echo $KUBECONFIG
   # If not set:
   export KUBECONFIG=/path/to/your/kubeconfig
   ```

3. **Check build tags:**
   - The configuration uses `-tags=ee` or `-tags=ce` for proper compilation
   - Make sure `CGO_ENABLED=1` is set in the launch.json

4. **Clean and rebuild:**
   ```bash
   cd modules/api
   make clean
   make kubermatic-api
   ```

### Common Issues

**Issue: "build constraints exclude all Go files"**
- Solution: The launch.json now includes proper `buildFlags: "-tags=ee -mod=mod"`

**Issue: "cannot find package"**
- Solution: Run `go mod tidy` and `go mod download`

**Issue: API won't start - port already in use**
- Solution: Change the port in launch.json or kill the process using the port:
  ```bash
  lsof -ti:8080 | xargs kill -9
  ```

## Debugging Tips

### Setting Conditional Breakpoints
1. Right-click on a breakpoint
2. Select "Edit Breakpoint"
3. Add a condition (e.g., `projectID == "abc123"`)

### Watching Variables
- In the Debug panel, use the "Variables" section
- Add expressions to "Watch" panel for custom evaluation

### Debug Console
- Use the Debug Console to evaluate expressions while paused
- Example: Type variable names to inspect their values

### Log Points
- Instead of breakpoints, you can add log points that don't stop execution
- Right-click in gutter → "Add Logpoint"

## Additional Resources

- [VSCode Go Debugging](https://github.com/golang/vscode-go/wiki/debugging)
- [Delve Documentation](https://github.com/go-delve/delve/tree/master/Documentation)
