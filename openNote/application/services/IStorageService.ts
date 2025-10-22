// mô phỏng file sau khi được lưu trữ
export interface UploadedFile {
    path: string; // URL hoặc đường dẫn file
    fileName: string;
    size: number;
    mimeType: string;
}

// Interface mô phỏng file ban đầu được upload
export interface UploadedInputFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer?: Uint8Array;
}

// Interface cho dịch vụ lưu trữ
export interface IStorageService {
    upload(file: UploadedInputFile): Promise<UploadedFile>;
    delete(path: string): Promise<void>;
    // in case storage service hỗ trợ copy trực tiếp
    copy?(sourcePath: string, targetFileName: string): Promise<UploadedFile>;
    // in case cần tải file từ storage về
    download(path: string): Promise<Uint8Array>;
}
