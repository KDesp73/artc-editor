"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Download, Loader2, Sun, Moon, HelpCircle, X } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ArtcLuaEditor() {
  const { theme, setTheme } = useTheme();

  const [script, setScript] = useState(`-- write your script :)
window(800, 800)
palette("catppuccin")
bg(palette.black)
fps(30)

function setup()
end

function update(dt)
end
  `);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [view, setView] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [monacoTheme, setMonacoTheme] = useState<"vs-dark" | "light">("vs-dark");

  const [showHelp, setShowHelp] = useState(false);
  const [apiHelpText, setApiHelpText] = useState("");
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);

  useEffect(() => {
    if (theme === "dark") {
      setMonacoTheme("vs-dark");
    } else {
      setMonacoTheme("light");
    }
  }, [theme]);

  useEffect(() => {
    if (showHelp) {
      setLoadingHelp(true);
      setHelpError(null);

      fetch("https://raw.githubusercontent.com/KDesp73/artc/refs/heads/main/artc.lua")
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
          return res.text();
        })
        .then(setApiHelpText)
        .catch((err) => setHelpError(err.message))
        .finally(() => setLoadingHelp(false));
    }
  }, [showHelp]);

  const runScript = async () => {
    setLoading(true);
    setVideoUrl(null);
    setError(null);
    setView("output");

    try {
      const service = "https://c844303060fa.ngrok-free.app";
      const res = await fetch(`${service}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, duration: duration }),
      });

      if (!res.ok) {
        const e = await res.json();
        const rawDetail = e.detail;

        const cleaned = rawDetail
          .replace(/^b?"/, "")
          .replace(/"$/, "")
          .replace(/\\n/g, "\n")
          .replace(/\[ERRO\] ?/g, "");

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHelp(true)}>
            <HelpCircle className="w-4 h-4 mr-2" />
            API Help
          </Button>
          <Button variant="ghost" onClick={toggleTheme} className="flex items-center gap-2">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
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
              <div className="flex items-center gap-4 flex-wrap">
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
              ) : (
                <p className="text-sm text-gray-500">No video generated yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="pt-8 text-center text-sm text-muted-foreground">
        Made with ❤️ by <a href="https://github.com/KDesp73/artc" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">KDesp73</a>
      </footer>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-2xl w-full relative">
            <Button
              onClick={() => setShowHelp(false)}
              className="absolute top-2 right-2"
              variant="ghost"
              size="icon"
            >
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> Lua API Reference
            </h2>
            <ScrollArea className="h-[60vh]">
              {loadingHelp ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading help...
                </p>
              ) : helpError ? (
                <p className="text-sm text-red-500">Error: {helpError}</p>
              ) : (
                <pre className="whitespace-pre-wrap text-sm">{apiHelpText}</pre>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
