import fs from "fs/promises";

// @note interfaces for items.json structure
interface ItemData {
  item_id: number;
  name: string;
}

interface ItemsFile {
  version: number;
  item_count: number;
  items: ItemData[];
}

export class GenerateItemsEnum {
  // @note cached regex patterns for sanitizeEnumName
  private static readonly SANITIZE_REGEX = /[^A-Za-z0-9_ ]/g;
  private static readonly SPACE_REGEX = / /g;
  private static readonly DIGIT_START_REGEX = /^[0-9]/;
  private static readonly INVALID_NAMES = new Set(["", "0", "NULL", "NONE", "N"]);

  private filePath: string;
  private itemsData: ItemsFile | null;

  constructor() {
    this.filePath = "items.json";
    this.itemsData = null;
  }

  // @note loadFromFile - loads items.json from given path, validates file type
  public async loadFromFile(filePath: string = "items.json"): Promise<void> {
    this.filePath = filePath;

    if (!this.filePath.endsWith(".json")) {
      throw new Error(`Invalid file type. Expected a .json file: ${this.filePath}`);
    }

    const fileStat = await fs.stat(this.filePath);
    if (!fileStat.isFile()) {
      throw new Error(`Not a valid file: ${this.filePath}`);
    }

    const fileContent = await fs.readFile(this.filePath, "utf-8");
    this.itemsData = JSON.parse(fileContent);
  }

  get itemsVersion(): number {
    return this.itemsData?.version ?? -1;
  }

  get itemsCount(): number {
    return this.itemsData?.item_count ?? -1;
  }

  // @note buildEnum - generates C++ enum string from loaded items data
  public buildEnum(tabSize: number = 4): string {
    if (!this.itemsData) {
      throw new Error("Items data not loaded. Please load data before building enum.");
    }

    const indent = " ".repeat(tabSize);
    const lines: string[] = [];

    for (const item of this.itemsData.items) {
      const itemName = this.sanitizeEnumName(item.name);
      if (GenerateItemsEnum.INVALID_NAMES.has(itemName)) continue;
      lines.push(`${indent}${itemName} = ${item.item_id},`);
    }

    return `enum eItems {\n${lines.join("\n")}\n};\n`;
  }

  // @note sanitizeEnumName - converts item name to valid C++ enum identifier
  private sanitizeEnumName(name: string): string {
    const sanitized = name
      .trim()
      .replace(GenerateItemsEnum.SANITIZE_REGEX, "")
      .replace(GenerateItemsEnum.SPACE_REGEX, "_")
      .toUpperCase();

    if (GenerateItemsEnum.DIGIT_START_REGEX.test(sanitized)) {
      return `_${sanitized}`;
    }
    return sanitized;
  }
}