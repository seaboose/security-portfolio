# When can a player dash again?

Survive’s gameplay code rejects an ability request while the current time is earlier than its deadline. This case isolates that check for a dash. Other checks, such as whether the player is already dashing, still govern the full ability. [Original C++ condition](https://github.com/seaboose/Surge/blob/8ec22fafec65c70f8150de9044ec51bb5c6dcfb1/unreal/SurgeMovementLab/Source/SurgeMovementLab/LabCharacter.cpp#L310-L320)

## Read the plain build

The two x64 builds take the same inputs. In this Windows build, `xmm0` holds the current time and `xmm1` holds the deadline. MSVC compiled `!(now < deadline)` into the following instructions.

```asm
comisd xmm1, xmm0  ; compare the deadline with the current time
setbe  al          ; return true if the deadline is below or equal (finite inputs)
ret
```

At exactly eight seconds with a deadline of eight seconds, the comparison sets the zero flag. The function returns true in `al`. The cooldown gate opens at equality.

## What survived compilation?

The second version represents “waiting” as byte `0x5A` and “ready” as `0xC3`. A volatile local keeps the intermediate store visible in optimized code. The same ordered comparison now selects a byte with a conditional move. At equality the move does not fire, so the function stores `0xC3` and later returns true.

```asm
comisd xmm1, xmm0
mov    eax, 0C3h
mov    ecx, 5Ah
cmova  eax, ecx             ; deadline > now selects waiting
mov    byte ptr [rsp+8], al
movzx  eax, byte ptr [rsp+8]
cmp    al, 0C3h
sete   al
ret
```

MSVC 19.44.35229 for Windows x64 emitted 8 bytes for the plain function and 32 for the encoded one with `/O2 /fp:precise`. Both executables passed the same nine checks. Each deadline (1, 8 and 64 seconds) was sampled a quarter-second before expiry, exactly at expiry and a quarter-second after. These are exactly representable, finite inputs. The test covers the isolated source-level fixture. The change in machine code establishes that the transformation survived optimization. Its effect on AI recovery remains unmeasured.

## Reproduce on Windows

From an x64 developer shell for Visual Studio with the C++ tools installed, open PowerShell in this case directory and run the following block. It only builds the included source. A different compiler version can emit different instructions.

```powershell
foreach ($variant in 0, 1) {
    cl /nologo /O2 /fp:precise "/DENCODE_STATE=$variant" "/Focooldown$variant.obj" "/Fecooldown$variant.exe" cooldown.cpp
    if ($LASTEXITCODE) { throw "Build failed for variant $variant" }
    & ".\cooldown$variant.exe"
    if ($LASTEXITCODE) { throw "Boundary check failed for variant $variant (exit $LASTEXITCODE)" }
    dumpbin /nologo /disasm "cooldown$variant.obj" | Select-String '^ready:' -Context 0,9
}
```

## How this fits Insight

Insight is designed to let an analyst interpret a routine and test that interpretation. This fixture is the first case material. A blind agent comparison belongs to the next stage. Each build gets an independent attempt under the same budget, with the source and hidden answers withheld. The analyst reviews the scored answers before exporting a finding.
