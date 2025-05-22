"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Download, Loader2 } from "lucide-react";

export default function ArtcLuaEditor() {
  const [script, setScript] = useState(`-- artc example script
window(1080, 720)
bg("#000000")
seed(73)

function setup()
    local cx = 1080 / 2
    local cy = 720 / 2
    local radius = 200
    local count = 20
    local size = 20

    for i = 1, count do
        local angle = (i / count) * (2 * math.pi)
        local x = cx + math.cos(angle) * radius
        local y = cy + math.sin(angle) * radius

        local r = 127 + math.sin(i)     * 127
        local g = 127 + math.sin(i + 2) * 127
        local b = 127 + math.sin(i + 4) * 127

        circle({
            x = x,
            y = y,
            size = size,
            color = hex({ r = r, g = g, b = b }),
            motion = "pulse",
            radius = 20 + i * 3/2,
            speed = 2,
        })
    end
end`);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [view, setView] = useState("editor");
  const [loading, setLoading] = useState(false);

  const runScript = async () => {
    setLoading(true);
    setVideoUrl(null);
    setView("output");

    try {
      const service = "https://b5d2-91-140-25-65.ngrok-free.app";
      const res = await fetch(`${service}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, duration: 10 }),
      });

      const data = await res.json();
      if (data.video_url) {
        const video = `${service}${data.video_url}`;
        console.log("Video URL: ", video);
        setVideoUrl(video);
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
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error("Failed to fetch video");
  
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "artc_video.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading video:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Artc Lua Script Editor</h1>

      <Tabs value={view} onValueChange={setView} className="space-y-2">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <Card>
            <CardContent className="p-2 space-y-2">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="h-100% font-mono"
              />
              <div className="flex gap-2">
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
                    className="w-full h-64"
                    crossOrigin="anonymous"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button onClick={downloadVideo} variant="secondary">
                      <Download className="w-4 h-4 mr-1" /> Download Video
                    </Button>
                  </div>
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
