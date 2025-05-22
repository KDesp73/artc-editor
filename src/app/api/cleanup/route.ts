import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST() {
    const folder = path.join(process.cwd(), "public/videos");
    const maxAge = 1000 * 60 * 10;

    try {
        const files = fs.readdirSync(folder);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(folder, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                console.log("Deleted:", filePath);
            }
        }

        return NextResponse.json({ status: "cleanup complete" });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "cleanup failed" }, { status: 500 });
    }
}

