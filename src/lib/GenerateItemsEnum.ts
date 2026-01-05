import fs from "fs";

export class GenerateItemsEnum {
  private filePath: string;
  private itemsData: any;

  constructor() {
    this.filePath = "items.json";
    this.itemsData = null;
  }

  public loadFromFile(filePath: string = "items.json"): void {
    this.filePath = filePath;

    // Check if file exists
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`File not found: ${this.filePath}`);
    }

    // Check file type
    const fileStat = fs.statSync(this.filePath);
    if (!fileStat.isFile()) {
      throw new Error(`Not a valid file: ${this.filePath}`);
    }
    if (!this.filePath.endsWith(".json")) {
      throw new Error(`Invalid file type. Expected a .json file: ${this.filePath}`);
    }

    const fileContent = fs.readFileSync(this.filePath, "utf-8");
    this.itemsData = JSON.parse(fileContent);
  }

  get itemsVersion(): number {
    return this.itemsData.version as number || -1;
  }
  get itemsCount(): number {
    return this.itemsData.item_count as number || -1;
  }

  public buildEnum(tabSize: number = 4): string {
    if (!this.itemsData) {
      throw new Error("Items data not loaded. Please load data before building enum.");
    }

    let enumString = `enum eItems {\n`;
    for (const item of this.itemsData.items) {
      const itemName = this.sanitizeEnumName(item.name as string);


      // Validate item name
      if (["", "0", "NULL", "NONE", "N"].includes(itemName)) continue;

      enumString += `${" ".repeat(tabSize)}${itemName} = ${item.item_id},\n`;
    }
    enumString += `};\n`;
    return enumString;
  }

  private sanitizeEnumName(name: string): string {
    // Sanitize item name into enum-safe identifier
    const sanitized = name
      .trim()
      .replace(/[^A-Za-z0-9_ ]/g, '')
      .replace(/ /g, '_')
      .toUpperCase();

    // Add '_' prefix if name starts with a digit
    if (/^[0-9]/.test(sanitized)) {
      return `_${sanitized}`;
    }
    return sanitized;
  }
}