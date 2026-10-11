export default class UserAccessServices {
  public static async canRead(
    userId: string,
    targetId: string,
    isAdmin: boolean = false,
  ): Promise<boolean> {
    if (isAdmin) return true;

    return userId === targetId;
  }

  public static async canWrite(
    userId: string,
    targetId: string,
    isAdmin: boolean = false,
  ): Promise<boolean> {
    if (isAdmin) return true;

    return userId === targetId;
  }
}
