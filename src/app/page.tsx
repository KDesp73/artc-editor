"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Download, Loader2, Sun, Moon } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

export default function ArtcLuaEditor() {
  const { theme, setTheme } = useTheme();

  const [script, setScript] = useState(`-- artc example script
window(800, 800)
bg("#000014")

local centerX, centerY = 400, 400
local cube = {}
local lines = {}
local size = 100

function setup()
    local function addPoint(x, y, z)
        return {
            x = x, y = y, z = z,
            id = circle({
                x = 0, y = 0, size = 4,
                color = "#ffffff", motion = "none", speed = 0
            })
        }
    end

    local s = size
    -- Define 8 cube vertices
    cube = {
        addPoint(-s, -s, -s), addPoint(s, -s, -s),
        addPoint(s, s, -s), addPoint(-s, s, -s),
        addPoint(-s, -s, s), addPoint(s, -s, s),
        addPoint(s, s, s), addPoint(-s, s, s),
    }

    local edges = {
        {1,2},{2,3},{3,4},{4,1}, -- back face
        {5,6},{6,7},{7,8},{8,5}, -- front face
        {1,5},{2,6},{3,7},{4,8}  -- connections
    }

    -- Draw edges as lines
    for _, edge in ipairs(edges) do
        table.insert(lines, {
            a = edge[1], b = edge[2],
            id = line({
                x1 = 0, y1 = 0, x2 = 0, y2 = 0,
                color = "#8888ff"
            })
        })
    end
end

-- 3D rotation function
local function rotate(point, t)
    local x, y, z = point.x, point.y, point.z

    -- Rotate around Y axis
    local sinY, cosY = math.sin(t), math.cos(t)
    x, z = x * cosY - z * sinY, x * sinY + z * cosY

    -- Rotate around X axis
    local sinX, cosX = math.sin(t * 0.6), math.cos(t * 0.6)
    y, z = y * cosX - z * sinX, y * sinX + z * cosX

    return x, y, z
end

-- Perspective projection
local function project(x, y, z)
    local scale = 400 / (z + 400)
    return centerX + x * scale, centerY + y * scale
end

function update(dt)
    local t = time() * 0.001

    local positions = {}

    for i, p in ipairs(cube) do
        local x, y, z = rotate(p, t)
        local px, py = project(x, y, z)
        modify(p.id, { x = px, y = py })
        positions[i] = { x = px, y = py }
    end

    for _, l in ipairs(lines) do
        local a = positions[l.a]
        local b = positions[l.b]
        modify(l.id, { x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y })
    end
end
`);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [view, setView] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const [monacoTheme, setMonacoTheme] = useState<"vs-dark" | "light">("vs-dark");

  useEffect(() => {
    if (theme === "dark") {
      setMonacoTheme("vs-dark");
    } else {
      setMonacoTheme("light");
    }
  }, [theme]);

  const runScript = async () => {
    setLoading(true);
    setVideoUrl(null);
    setError(null);
    setView("output");

    try {
      const service = "https://b5d2-91-140-25-65.ngrok-free.app";
      const res = await fetch(`${service}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, duration: duration * 2 }),
      });

      if (!res.ok) {
          const e = await res.json();
          const rawDetail = e.detail;

          // Remove b"" if present and unescape \n
          const cleaned = rawDetail
          .replace(/^b?"/, "")         // remove leading b" or "
          .replace(/"$/, "")           // remove trailing "
          .replace(/\\n/g, "\n")       // convert literal \n to real newlines
          .replace(/\[ERRO\] ?/g, "")  // remove all [ERRO] tags

          throw new Error(cleaned.trim());
      }

      const data = await res.json();
      if (data.video_url) {
        setVideoUrl(data.video_url);
      } else {
        setError("No video URL returned from server.");
        console.error("No video_url in response", data);
      }
    } catch (err: unknown) {
      console.error("Failed to render script:", err);
      setError((err as Error).message || "An unknown error occurred.");
    }

    setLoading(false);
  };

  const exportScript = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.lua";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;

    try {
      setLoading(true);
      const response = await fetch(videoUrl, { mode: "cors" });

      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

      const blob = await response.blob();

      if (blob.size === 0) throw new Error("Downloaded video is empty");

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "artc_video.mp4";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setLoading(false);
      }, 100);
    } catch (error) {
      setLoading(false);
      console.error("Error downloading video:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artc Lua Script Editor</h1>
        <Button variant="ghost" onClick={toggleTheme} className="flex items-center gap-2">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
      </div>

      <Tabs value={view} onValueChange={setView} className="space-y-2">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <Card>
            <CardContent className="p-2 space-y-2">
              <Editor
                height="70vh"
                defaultLanguage="lua"
                theme={monacoTheme}
                value={script}
                onChange={(val) => setScript(val || "")}
              />
              <div className="flex items-center gap-4">
                <label>
                  Duration (seconds):
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="ml-2 w-20 border rounded px-2 py-1"
                    disabled={loading}
                  />
                </label>

                <Button onClick={runScript} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" /> Run
                    </>
                  )}
                </Button>

                <Button onClick={exportScript} variant="secondary" disabled={loading}>
                  <Download className="w-4 h-4 mr-1" /> Export Script
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output">
          <Card>
            <CardContent className="p-2 space-y-2">
              {loading ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rendering video...
                </p>
              ) : error ? (
                <p className="text-sm text-red-500">
                  <strong>Error:</strong> {error}
                </p>
              ) : videoUrl ? (
                <>
                  <video
                    src={videoUrl}
                    controls
                    crossOrigin="anonymous"
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.width = video.videoWidth;
                      video.height = video.videoHeight;
                    }}
                  />
                  <Button onClick={downloadVideo} variant="default" disabled={loading || !videoUrl}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </>
              ) : (<>
                {error ? (
                  <pre className="text-sm text-red-500 whitespace-pre-wrap">
                    <strong>Error:</strong> {error}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500">No video generated yet.</p>
                )}
              </>)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        <footer className="pt-8 text-center text-sm text-muted-foreground">
          Made with ❤️ by <a href="https://github.com/KDesp73/artc" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">KDesp73</a>
        </footer>
    </div>
  );
}
