import { NextRequest } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { script } = await req.json();

        if (typeof script !== "string") {
            return new Response("Invalid script", { status: 400 });
        }

        const filename = `artc_script_${Date.now()}.lua`;
        const filepath = path.join(os.tmpdir(), filename);
        await writeFile(filepath, script, "utf-8");

        const { stdout, stderr } = await execAsync(`artc ${filepath}`);

        await unlink(filepath);

        return Response.json({
            output: stdout + (stderr ? `\n[stderr]\n${stderr}` : ""),
        });
    } catch (err: any) {
        return Response.json({
            error: err.message || "Failed to run artc script",
        }, { status: 500 });
    }
}
