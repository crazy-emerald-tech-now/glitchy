import React, { useState, useEffect, useRef } from 'react';
import { Play, Share2, Globe, Fish, Sparkles, Copy, Check, ExternalLink, Terminal, Server, Plus, Trash2, File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4zTqB9v1v8-Qq_iUFD3-u6SVAJ86rFyo",
  authDomain: "glitchy-1.firebaseapp.com",
  projectId: "glitchy-1",
  storageBucket: "glitchy-1.firebasestorage.app",
  messagingSenderId: "841735820998",
  appId: "1:841735820998:web:2d670ae67a6e9de63ea9c7",
  measurementId: "G-150LGWEJR8",
  databaseURL: "https://glitchy-1-default-rtdb.firebaseio.com"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

export default function GlitchClone() {
  const [projectId, setProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [activeFile, setActiveFile] = useState('server.js');
  const [files, setFiles] = useState({});
  const [consoleLog, setConsoleLog] = useState([]);
  const [serverRunning, setServerRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState({ '/': true });
  const iframeRef = useRef(null);
  const consoleEndRef = useRef(null);

  // Initialize or load project from URL
  useEffect(() => {
    const urlPath = window.location.pathname;
    const match = urlPath.match(/\/project\/([a-zA-Z0-9-]+)/);
    
    if (match) {
      loadProject(match[1]);
    } else {
      createNewProject();
    }
  }, []);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLog]);

  const createNewProject = async () => {
    const newId = generateId();
    const defaultFiles = {
      'server.js': `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// API Routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from your server!' });
});

app.post('/api/echo', (req, res) => {
  res.json({ echo: req.body });
});

app.listen(port, () => {
  console.log(\`🚀 Server running on port \${port}\`);
});`,
      'public/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Glitchy App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>✨ Your Live App!</h1>
    <p>This is served from your Node.js server</p>
    <button onclick="testAPI()">Test API</button>
    <div id="response"></div>
  </div>
  <script src="client.js"></script>
</body>
</html>`,
      'public/style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
  max-width: 500px;
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

h1 {
  color: #667eea;
  margin-bottom: 20px;
}

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
  margin: 20px 0;
}

button:hover {
  transform: translateY(-2px);
}

#response {
  margin-top: 20px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 8px;
  font-family: monospace;
}`,
      'public/client.js': `async function testAPI() {
  const response = await fetch('/api/hello');
  const data = await response.json();
  document.getElementById('response').textContent = 
    JSON.stringify(data, null, 2);
}`,
      'package.json': `{
  "name": "my-glitchy-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}`
    };

    const newProject = {
      id: newId,
      name: 'my-glitchy-app',
      files: defaultFiles,
      createdAt: Date.now()
    };

    setProjectId(newId);
    setProject(newProject);
    setFiles(defaultFiles);
    
    // Save to Firebase
    await saveProject(newId, newProject);
    
    // Update URL without reload
    window.history.pushState({}, '', `/project/${newId}`);
    
    addConsoleLog('info', '✨ Project created! Edit your files and click "Start Server"');
  };

  const loadProject = async (id) => {
    addConsoleLog('info', `Loading project ${id}...`);
    
    try {
      const projectRef = ref(database, `projects/${id}`);
      const snapshot = await get(projectRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setProjectId(id);
        setProject(data);
        setFiles(data.files);
        addConsoleLog('success', 'Project loaded from Firebase!');
        
        // Listen for real-time updates
        onValue(projectRef, (snapshot) => {
          const updatedData = snapshot.val();
          if (updatedData) {
            setProject(updatedData);
            setFiles(updatedData.files);
          }
        });
      } else {
        addConsoleLog('warning', 'Project not found, creating new one...');
        createNewProject();
      }
    } catch (error) {
      addConsoleLog('error', `Load failed: ${error.message}`);
      createNewProject();
    }
  };

  const saveProject = async (id, projectData) => {
    try {
      const projectRef = ref(database, `projects/${id}`);
      await set(projectRef, {
        ...projectData,
        updatedAt: Date.now()
      });
      addConsoleLog('success', '💾 Project saved to Firebase!');
    } catch (error) {
      addConsoleLog('error', `Save failed: ${error.message}`);
    }
  };

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  };

  const addConsoleLog = (type, message) => {
    setConsoleLog(prev => [...prev, { type, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const startServer = async () => {
    setServerRunning(true);
    addConsoleLog('info', '🚀 Starting server...');
    
    try {
      // Send code to Netlify function to execute
      const response = await fetch('/.netlify/functions/runServer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId,
          files 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        addConsoleLog('success', '✅ Server started successfully!');
        addConsoleLog('info', `📡 Server URL: ${getServerUrl()}`);
        
        // Refresh preview
        if (iframeRef.current) {
          iframeRef.current.src = getServerUrl();
        }
      } else {
        addConsoleLog('error', `❌ Error: ${data.error}`);
        setServerRunning(false);
      }
    } catch (error) {
      addConsoleLog('error', `❌ Failed to start: ${error.message}`);
      setServerRunning(false);
    }
  };

  const stopServer = () => {
    setServerRunning(false);
    addConsoleLog('info', '🛑 Server stopped');
  };

  const updateFile = (filename, content) => {
    const newFiles = { ...files, [filename]: content };
    setFiles(newFiles);
    
    // Auto-save
    if (project) {
      const updatedProject = { ...project, files: newFiles };
      setProject(updatedProject);
      saveProject(projectId, updatedProject);
    }
  };

  const addNewFile = () => {
    const filename = prompt('Enter filename (e.g., routes/users.js):');
    if (filename) {
      updateFile(filename, '// New file\n');
      setActiveFile(filename);
    }
  };

  const deleteFile = (filename) => {
    if (confirm(`Delete ${filename}?`)) {
      const newFiles = { ...files };
      delete newFiles[filename];
      setFiles(newFiles);
      
      if (activeFile === filename) {
        setActiveFile(Object.keys(newFiles)[0]);
      }
    }
  };

  const getServerUrl = () => {
    return `/.netlify/functions/proxy?project=${projectId}`;
  };

  const getShareUrl = () => {
    return `${window.location.origin}/project/${projectId}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearConsole = () => {
    setConsoleLog([]);
  };

  const organizeFiles = () => {
    const organized = {};
    Object.keys(files).forEach(path => {
      const parts = path.split('/');
      let current = organized;
      
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { type: 'file', path };
        } else {
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} };
          }
          current = current[part].children;
        }
      });
    });
    return organized;
  };

  const FileTree = ({ tree, prefix = '' }) => {
    return Object.entries(tree).map(([name, node]) => {
      const fullPath = prefix ? `${prefix}/${name}` : name;
      
      if (node.type === 'file') {
        return (
          <div
            key={node.path}
            onClick={() => setActiveFile(node.path)}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 rounded ${
              activeFile === node.path ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
            }`}
          >
            <File className="w-4 h-4" />
            <span className="text-sm flex-1">{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFile(node.path);
              }}
              className="opacity-0 hover:opacity-100 p-1 hover:bg-red-100 rounded"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </div>
        );
      } else {
        const isExpanded = expandedFolders[fullPath];
        return (
          <div key={fullPath}>
            <div
              onClick={() => setExpandedFolders(prev => ({ ...prev, [fullPath]: !prev[fullPath] }))}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 rounded text-gray-700"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium">{name}</span>
            </div>
            {isExpanded && (
              <div className="ml-4">
                <FileTree tree={node.children} prefix={fullPath} />
              </div>
            )}
          </div>
        );
      }
    });
  };

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Fish className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Glitchy
              </span>
            </div>
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject({...project, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            {serverRunning ? (
              <button
                onClick={stopServer}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Server className="w-4 h-4" />
                Stop Server
              </button>
            ) : (
              <button
                onClick={startServer}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Server
              </button>
            )}
            
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <Globe className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={getShareUrl()}
              readOnly
              className="flex-1 bg-transparent focus:outline-none text-sm font-mono text-gray-600"
            />
            <button onClick={copyShareLink} className="p-1 hover:bg-gray-200 rounded">
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-gray-700">Files</span>
            <button
              onClick={addNewFile}
              className="p-1 hover:bg-gray-100 rounded"
              title="New File"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <FileTree tree={organizeFiles()} />
          </div>
        </div>

        {/* Editor + Console */}
        <div className="flex-1 flex flex-col">
          {/* Code Editor */}
          <div className={`${showConsole ? 'h-2/3' : 'flex-1'} flex flex-col bg-white border-r border-gray-200`}>
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-mono text-gray-600">{activeFile}</span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Auto-saving
              </div>
            </div>
            <textarea
              value={files[activeFile] || ''}
              onChange={(e) => updateFile(activeFile, e.target.value)}
              className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50"
              style={{ tabSize: 2 }}
              spellCheck="false"
            />
          </div>

          {/* Console */}
          {showConsole && (
            <div className="h-1/3 bg-gray-900 flex flex-col border-t border-gray-700">
              <div className="px-4 py-2 bg-gray-800 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-2 text-white">
                  <Terminal className="w-4 h-4" />
                  <span className="text-sm font-semibold">Console</span>
                </div>
                <button
                  onClick={clearConsole}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                {consoleLog.map((log, i) => (
                  <div key={i} className="flex gap-3 mb-1">
                    <span className="text-gray-500 text-xs">{log.timestamp}</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-4 py-2 bg-gray-800 text-white flex items-center justify-between">
            <span className="text-sm font-semibold">Live Preview</span>
            {serverRunning && (
              <span className="flex items-center gap-2 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Server Running
              </span>
            )}
          </div>
          <div className="flex-1">
            <iframe
              ref={iframeRef}
              src={serverRunning ? getServerUrl() : 'about:blank'}
              className="w-full h-full border-0"
              title="preview"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-600">
          <span>Project ID: {projectId}</span>
        </div>
        <div className="flex items-center gap-2 text-purple-600">
          <Sparkles className="w-4 h-4" />
          <span>Build something amazing!</span>
        </div>
      </div>
    </div>
  );
}
