import axios from "axios";

export async function canReach(url: string, timeout = 5000): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}
