If WScript.Arguments.length = 0 Then
  Set objShell = CreateObject("Shell.Application")
  objShell.ShellExecute "wscript.exe", Chr(34) & WScript.ScriptFullName & Chr(34) & " admin", "", "runas", 1
Else
  Set WshShell = CreateObject("WScript.Shell")
  WshShell.Run "cmd /c netsh advfirewall firewall add rule name=""Digital Menu Frontend"" dir=in action=allow protocol=TCP localport=3000 & netsh advfirewall firewall add rule name=""Digital Menu Backend"" dir=in action=allow protocol=TCP localport=8000", 0, True
  MsgBox "Done! Firewall ports 3000 and 8000 are now open." & vbCrLf & vbCrLf & "Mobile URLs:" & vbCrLf & "  http://192.168.20.152:3000" & vbCrLf & "  http://192.168.20.152:3000/admin", 64, "Digital Menu - Firewall Open"
End If
