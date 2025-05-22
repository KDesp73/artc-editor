"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Download, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function ArtcLuaEditor() {
  const { theme, setTheme } = useTheme();

  const [script, setScript] = useState(`-- artc example script
window(800, 800)
bg("#000014")
seed(42)

local particles = {}
local count = 200
local centerX, centerY = 400, 400

function setup()
    for i = 1, count do
        local angle = (i / count) * math.pi * 2
        local radius = math.random(50, 300)
        local size = math.random(4, 12)
        local speed = 0.5 + math.random() * 1.5

        local id = circle({
            x = centerX + math.cos(angle) * radius,
            y = centerY + math.sin(angle) * radius,
            size = size,
            color = "#ffffff",
            motion = "none",
            speed = 0
        })

        particles[i] = {
            id = id,
            angle = angle,
            radius = radius,
            size = size,
            speed = speed,
            offset = math.random() * 2 * math.pi
        }
    end
end

function hslToRgb(h, s, l)
    if s == 0 then
        local gray = l * 255
        return gray, gray, gray
    else
        local function hue2rgb(p, q, t)
            if t < 0 then t = t + 1 end
            if t > 1 then t = t - 1 end
            if t < 1/6 then return p + (q - p) * 6 * t end
            if t < 1/2 then return q end
            if t < 2/3 then return p + (q - p) * (2/3 - t) * 6 end
            return p
        end

        local q = l < 0.5 and l * (1 + s) or l + s - l * s
        local p = 2 * l - q
        local r = hue2rgb(p, q, h + 1/3)
        local g = hue2rgb(p, q, h)
        local b = hue2rgb(p, q, h - 1/3)
        return r * 255, g * 255, b * 255
    end
end

function update(dt)
    local t = time() * 0.001

    for i = 1, #particles do
        local p = particles[i]
        local a = p.angle + t * p.speed
        local r = p.radius + math.sin(t * 0.5 + i) * 10

        local x = centerX + math.cos(a + p.offset) * r
        local y = centerY + math.sin(a + p.offset) * r

        -- Create smooth hue cycling
        local hue = (t * 0.05 + i / count) % 1.0
        local lightness = 0.4 + 0.3 * math.sin(t * 2 + i)
        local r, g, b = hslToRgb(hue, 1.0, lightness)

        modify(p.id, {
            x = x,
            y = y,
            color = hex({ r = r, g = g, b = b }),
            size = p.size + math.sin(t + i) * 1.5
        })
    end
end`);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [view, setView] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(10);
  
  // Monaco theme state synced with next-themes theme
  const [monacoTheme, setMonacoTheme] = useState<"vs-dark" | "light">("vs-dark");

  // Sync monacoTheme with current theme on mount and theme change
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
    setView("output");

    try {
      const service = "https://b5d2-91-140-25-65.ngrok-free.app";
      const res = await fetch(`${service}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, duration: duration * 2 }), // Service returns video with half duration
      });

      const data = await res.json();
      if (data.video_url) {
        setVideoUrl(data.video_url);
      } else {
        console.error("No video_url in response");
      }
    } catch (err) {
      console.error("Failed to render script", err);
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

  // Theme toggle handler
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
              ) : (
                <p className="text-sm text-gray-500">No video generated yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
