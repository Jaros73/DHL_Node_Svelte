import { mkdir, readFile, rename, rm, unlink } from "node:fs/promises";
import { extname, join } from "node:path";
import multer from "multer";
import { UPLOAD_DESTINATION, UPLOAD_PERSIST } from "../config";

export interface File {
  originalname: string;
  filename: string;
}

export interface FileUploaded extends File {
  path: string;
}

export let filesUploadHandler = multer({ dest: UPLOAD_DESTINATION });

export async function filesRemoveUploaded(files: FileUploaded[]) {
  await Promise.all(files.map((it) => unlink(it.path)));
}

function makePath(group: string, id: string, file: File) {
  return join(UPLOAD_PERSIST, group, id, `${file.filename}${extname(file.originalname)}`);
}

export async function filesRead(group: string, id: string, file: File) {
  return await readFile(makePath(group, id, file));
}

export async function filesPersist(group: string, id: string, files: FileUploaded[]) {
  await mkdir(`${UPLOAD_PERSIST}/${group}/${id}`, { recursive: true });
  await Promise.all(files.map((it) => rename(it.path, makePath(group, id, it))));
}

export async function filesRemove(group: string, id: string, files: File[]) {
  await Promise.all(files.map((it) => unlink(makePath(group, id, it))));
}

export async function filesRemoveGroup(group: string, id: string) {
  try {
    await rm(`${UPLOAD_PERSIST}/${group}/${id}`, { recursive: true });
  } catch (err) {
    if ((err as { code: string }).code === "ENOENT") {
      return;
    }

    throw err;
  }
}
