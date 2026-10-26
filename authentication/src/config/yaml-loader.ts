import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Nạp cấu hình từ tệp config.yaml (nếu tồn tại) và kết hợp với biến môi trường.
 */
export const yamlConfigurationLoader = () => {
  const yamlPath = path.resolve(process.cwd(), 'config.yaml');
  let yamlConfig: Record<string, any> = {};

  if (fs.existsSync(yamlPath)) {
    try {
      const fileContents = fs.readFileSync(yamlPath, 'utf8');
      yamlConfig = (yaml.load(fileContents) as Record<string, any>) || {};
    } catch (e) {
      console.warn(`[Config] Không thể đọc tệp ${yamlPath}: ${(e as Error).message}`);
    }
  }

  return yamlConfig;
};
