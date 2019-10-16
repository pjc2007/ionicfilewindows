import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { File, Entry, DirectoryEntry,  RemoveResult, FileEntry, DirectoryReader, Flags } from '@ionic-native/file/ngx';

export declare class FileError {
  static NOT_FOUND_ERR: number;
  static SECURITY_ERR: number;
  static ABORT_ERR: number;
  static NOT_READABLE_ERR: number;
  static ENCODING_ERR: number;
  static NO_MODIFICATION_ALLOWED_ERR: number;
  static INVALID_STATE_ERR: number;
  static SYNTAX_ERR: number;
  static INVALID_MODIFICATION_ERR: number;
  static QUOTA_EXCEEDED_ERR: number;
  static TYPE_MISMATCH_ERR: number;
  static PATH_EXISTS_ERR: number;
  /** Error code */
  code: number;
  message: string;
  constructor(code: number);
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})  
export class HomePage {
  cordovaFileError = {
    1: 'NOT_FOUND_ERR',
    2: 'SECURITY_ERR',
    3: 'ABORT_ERR',
    4: 'NOT_READABLE_ERR',
    5: 'ENCODING_ERR',
    6: 'NO_MODIFICATION_ALLOWED_ERR',
    7: 'INVALID_STATE_ERR',
    8: 'SYNTAX_ERR',
    9: 'INVALID_MODIFICATION_ERR',
    10: 'QUOTA_EXCEEDED_ERR',
    11: 'TYPE_MISMATCH_ERR',
    12: 'PATH_EXISTS_ERR',
    13: 'WRONG_ENTRY_TYPE',
    14: 'DIR_READ_ERR'
  };


  constructor(private platform : Platform, private file: File) { }
  
  public async checkFile(): Promise<void> {
    try {
      await this.platform.ready();
      const cord = <any>cordova;
      if (cord.file == undefined) {
        throw "Cordova file plugin not found, are cordova plugins included with the installer?";
      }

      const baseFolder: string = cord.file.dataDirectory; // On windows is "ms-appdata:///local"
      console.log(`baseFolder: ${baseFolder}`);

      const exits = await this.file.checkDir(baseFolder, "");
      console.log(`exists: ${exits}`);
      
      const dirEntries = [];
      const entries: Entry[] = await this.listDir(baseFolder, "");
      console.log(`files...`);
      for (let entry of entries) {
        console.log(entry.name);
        dirEntries.push(entry.name);
      }
    } catch (error) {
      console.error(JSON.stringify(error));
    }
  }

  private listDir(path: string, dirName: string): Promise<Entry[]> {
    if (/^\//.test(dirName)) {
      const err = new FileError(5);
      err.message = 'directory cannot start with /';
      return Promise.reject<Entry[]>(err);
    }

    return this.resolveDirectoryUrl(path)
      .then(fse => {
        console.log(`resolveDirectoryUrl: ${JSON.stringify(fse)}`);
        return this.getDirectory(fse, dirName, {
          create: false,
          exclusive: false
        });
      })
      .then(de => {
        console.log(`ABout to call readEntries`);
        const reader = de.createReader();
        return this.readEntries(reader);
      });
  }

  resolveDirectoryUrl(directoryUrl: string): Promise<DirectoryEntry> {
    return this.file.resolveLocalFilesystemUrl(directoryUrl).then(de => {
      console.log(`resolveLocalFilesystemUrl: ${JSON.stringify(de)}`);
      if (de.isDirectory) {
        return de as DirectoryEntry;
      } else {
        const err = new FileError(13);
        err.message = 'input is not a directory';
        console.error(`resolveLocalFilesystemUrl: input is not a directory`);
        return Promise.reject<DirectoryEntry>(err);
      }
    });
  }

  private readEntries(dr: DirectoryReader): Promise<Entry[]> {
    return new Promise<Entry[]>((resolve, reject) => {
      dr.readEntries(
        entries => {
          console.log(`readEntries succeeded`);
          resolve(<Entry[]>entries);
        },
        err => {
          console.error(`readEntries failed`);
          this.fillErrorMessage(<FileError>err);
          console.error(`readEntries failed: ${JSON.stringify(err)}`);
          reject(err);
        }
      );
    });
  }

  getDirectory(
    directoryEntry: DirectoryEntry,
    directoryName: string,
    flags: Flags
  ): Promise<DirectoryEntry> {
    return new Promise<DirectoryEntry>((resolve, reject) => {
      try {
        console.log(`-- calling getDirectory with directoryName: ${directoryName}, directoryEntry: ${JSON.stringify(directoryEntry)}, flags: ${JSON.stringify(flags)}`);
        directoryEntry.getDirectory(
          directoryName,
          flags,
          de => {
            console.log(`getDirectory succeeded`);
            resolve(de);
          },
          err => {
            this.fillErrorMessage(err);
            console.error(`getDirectory failed 1: ${JSON.stringify(err)}`);
            reject(err);
          }
        );
      } catch (xc) {
        this.fillErrorMessage(xc);
        console.error(`getDirectory failed 2: ${JSON.stringify(xc)}`);
        reject(xc);
      }
    });
  }


  /**
   * @hidden
   */
  private fillErrorMessage(err: FileError): void {
    try {
      err.message = this.cordovaFileError[err.code];
    } catch (e) { }
  }
}
