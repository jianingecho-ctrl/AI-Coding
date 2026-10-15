; A per-user Unicode installer. NSIS embeds its uninstaller at compile time,
; allowing a genuine Windows installer to be built without running EXEs on Linux.
Unicode true
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 64
Name "职场小判官"
InstallDir "$LOCALAPPDATA\Programs\WorkJudge"
InstallDirRegKey HKCU "Software\WorkJudge" "InstallDir"
!include "MUI2.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!ifdef NSIS_WIN32_MAKENSIS
  !define JUDGE_STAGE_GLOB "${PROJECT_DIR}\release\unified\win-unpacked\*"
  !include "${PROJECT_DIR}\release\unified\windows-uninstall-files.nsh"
!else
  !define JUDGE_STAGE_GLOB "${PROJECT_DIR}/release/unified/win-unpacked/*"
  !include "${PROJECT_DIR}/release/unified/windows-uninstall-files.nsh"
!endif
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\职场小判官.exe"
!define MUI_FINISHPAGE_RUN_TEXT "打开职场小判官"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!macro CheckRunning
  nsProcess::_FindProcess "职场小判官.exe"
  Pop $0
  nsProcess::_Unload
  ${If} $0 == 0
    MessageBox MB_OK|MB_ICONSTOP "请先在职场小判官中选择「退出」，再重新安装或卸载。"
    Abort
  ${EndIf}
!macroend
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "本安装包适用于 Windows 10/11 64 位电脑。"
    Abort
  ${EndIf}
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONSTOP "请使用 Windows 10 或 Windows 11。"
    Abort
  ${EndIf}
  SetRegView 64
  SetShellVarContext current
  !insertmacro CheckRunning
FunctionEnd
Function un.onInit
  SetRegView 64
  SetShellVarContext current
  !insertmacro CheckRunning
FunctionEnd
Section "安装"
  SetOutPath "$INSTDIR"
  ; Stage files were produced by electron-builder for win32-x64.
  File /r "${JUDGE_STAGE_GLOB}"
  WriteUninstaller "$INSTDIR\卸载职场小判官.exe"
  CreateDirectory "$SMPROGRAMS\职场小判官"
  CreateShortcut "$SMPROGRAMS\职场小判官\职场小判官.lnk" "$INSTDIR\职场小判官.exe"
  CreateShortcut "$SMPROGRAMS\职场小判官\卸载.lnk" "$INSTDIR\卸载职场小判官.exe"
  CreateShortcut "$DESKTOP\职场小判官.lnk" "$INSTDIR\职场小判官.exe"
  WriteRegStr HKCU "Software\WorkJudge" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "DisplayName" "职场小判官"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "Publisher" "职场小判官"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "DisplayIcon" "$INSTDIR\职场小判官.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "UninstallString" '$\"$INSTDIR\卸载职场小判官.exe$\"'
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge" "NoRepair" 1
SectionEnd
Section "Uninstall"
  SetRegView 64
  SetShellVarContext current
  Delete "$DESKTOP\职场小判官.lnk"
  Delete "$SMPROGRAMS\职场小判官\职场小判官.lnk"
  Delete "$SMPROGRAMS\职场小判官\卸载.lnk"
  RMDir "$SMPROGRAMS\职场小判官"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\WorkJudge"
  DeleteRegKey HKCU "Software\WorkJudge"
  ; Delete only the packaged files, never recursively erase a user-selected folder.
  ; Profiles, imported assets and music in %APPDATA% are deliberately retained.
  !insertmacro JudgeRemoveInstalledFiles
  Delete "$INSTDIR\卸载职场小判官.exe"
  RMDir "$INSTDIR"
SectionEnd
