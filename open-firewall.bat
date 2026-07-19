@echo off
echo Opening firewall ports for Digital Menu...
netsh advfirewall firewall add rule name="Digital Menu Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Digital Menu Backend" dir=in action=allow protocol=TCP localport=8000
echo.
echo Done! Ports 3000 and 8000 are now open on your network.
echo.
echo Mobile URLs:
echo   Customer Menu : http://192.168.20.152:3000
echo   Admin Panel   : http://192.168.20.152:3000/admin
echo.
pause
