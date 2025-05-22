"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Download } from "lucide-react";

export default function ArtcLuaEditor() {
  const [script, setScript] = useState(`-- artc example script
function setup()
  add_circle(100, 100, 30, {r=255, g=100, b=200}, MOTION_SPIN)
end`);
  const [output, setOutput] = useState("");
  const [view, setView] = useState("output");

  const runScript = async () => {
    try {
      const response = await fetch("/api/run-artc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script })
      });

      const data = await response.json();
      setOutput(data.output || "No output returned.");
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    }
    setView("output");
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
                className="h-64 font-mono"
              />
              <div className="flex gap-2">
                <Button onClick={runScript}>
                  <Play className="w-4 h-4 mr-1" /> Run
                </Button>
                <Button onClick={exportScript} variant="secondary">
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output">
          <Card>
            <CardContent className="p-2 font-mono whitespace-pre-wrap text-sm bg-black text-green-400 h-64 overflow-auto">
              {output || "No output yet."}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
