import { Injectable } from '@nestjs/common';
import { hash, compare, genSalt } from 'bcrypt';

@Injectable()
export class CryptoService {
  private readonly SALT_ROUNDS = 10;

  async hash(data: string): Promise<string> {
    const salt = await genSalt(this.SALT_ROUNDS);
    return hash(data, salt);
  }

  async compare(data: string, encryptedData: string): Promise<boolean> {
    if (!data || !encryptedData) return false;
    return compare(data, encryptedData);
  }
}
