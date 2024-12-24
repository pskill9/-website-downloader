# Website Downloader MCP Server

This MCP server provides a tool to download entire websites using wget. It preserves the website structure and converts links to work locally.

<a href="https://glama.ai/mcp/servers/egcwr79vu2"><img width="380" height="200" src="https://glama.ai/mcp/servers/egcwr79vu2/badge" alt="Google Workspace Server MCP server" /></a>

## Prerequisites

The server requires `wget` to be installed on your system.

### Installing wget

#### macOS
Using Homebrew:
```bash
brew install wget
```

#### Linux (Debian/Ubuntu)
```bash
sudo apt-get update
sudo apt-get install wget
```

#### Linux (Red Hat/Fedora)
```bash
sudo dnf install wget
```

#### Windows
1. Using [Chocolatey](https://chocolatey.org/):
```bash
choco install wget
```

2. Or download the binary from: https://eternallybored.org/misc/wget/
   - Download the latest wget.exe
   - Place it in a directory that's in your PATH (e.g., C:\Windows\System32)

## Usage

The server provides a tool called `download_website` with the following parameters:

- `url` (required): The URL of the website to download
- `outputPath` (optional): The directory where the website should be downloaded. Defaults to the current directory.
- `depth` (optional): Maximum depth level for recursive downloading. Defaults to infinite. Set to 0 for just the specified page, 1 for direct links, etc.

### Example

```json
{
  "url": "https://example.com",
  "outputPath": "/path/to/output",
  "depth": 2  // Optional: Download up to 2 levels deep
}
```

## Features

The website downloader:
- Downloads recursively with infinite depth
- Includes all page requisites (CSS, images, etc.)
- Converts links to work locally
- Adds appropriate extensions to files
- Restricts downloads to the same domain
- Preserves the website structure

## Installation

1. Build the server:
```bash
npm install
npm run build
```

2. Add to MCP settings:
```json
{
  "mcpServers": {
    "website-downloader": {
      "command": "node",
      "args": ["/path/to/website-downloader/build/index.js"]
    }
  }
}
