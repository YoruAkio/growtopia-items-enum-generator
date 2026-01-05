import fs from "fs";

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
  // @note cached regex for sanitization (combines non-alphanumeric removal + space to underscore)
  private static readonly SANITIZE_REGEX = /[^A-Za-z0-9_]+/g;
  private static readonly INVALID_NAMES = new Set(["", "0", "NULL", "NONE", "N"]);

  private itemsData: ItemsFile | null = null;

  // @note loadFromFile - loads items.json from given path, validates file type
  public loadFromFile(filePath: string): void {
    if (!filePath.endsWith(".json")) {
      throw new Error(`Invalid file type. Expected a .json file: ${filePath}`);
    }

    const fileStat = fs.statSync(filePath);
    if (!fileStat.isFile()) {
      throw new Error(`Not a valid file: ${filePath}`);
    }

    this.itemsData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
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

    const items = this.itemsData.items;
    const len = items.length;
    const indent = " ".repeat(tabSize);
    const invalidNames = GenerateItemsEnum.INVALID_NAMES;
    const regex = GenerateItemsEnum.SANITIZE_REGEX;

    // @note pre-allocate array for better performance
    const lines: string[] = new Array(len);
    let lineIdx = 0;

    for (let i = 0; i < len; i++) {
      const item = items[i];

      // @note inline sanitization for hot loop performance
      let sanitized = item.name.trim().replace(regex, "_").toUpperCase();

      // @note handle leading digit
      if (sanitized.charCodeAt(0) >= 48 && sanitized.charCodeAt(0) <= 57) {
        sanitized = "_" + sanitized;
      }

      if (invalidNames.has(sanitized)) continue;

      lines[lineIdx++] = `${indent}${sanitized} = ${item.item_id},`;
    }

    // @note trim unused array slots
    lines.length = lineIdx;

    return `enum eItems {\n${lines.join("\n")}\n};\n`;
  }
}
