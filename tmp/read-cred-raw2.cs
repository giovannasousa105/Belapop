using System;
using System.Runtime.InteropServices;
public class CredReadRaw2 {
  [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
  [DllImport("Advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
  public static extern void CredFree([In] IntPtr cred);
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
    public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  public static byte[] ReadBlob(string target) {
    IntPtr credPtr;
    if (!CredRead(target, 1, 0, out credPtr)) throw new Exception("CredRead failed: " + Marshal.GetLastWin32Error());
    try {
      CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
      byte[] blob = new byte[cred.CredentialBlobSize];
      if (cred.CredentialBlobSize > 0) Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
      return blob;
    } finally { CredFree(credPtr); }
  }
}
