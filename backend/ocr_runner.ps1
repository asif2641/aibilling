param(
    [Parameter(Mandatory=$true)]
    [string]$ImagePath,
    [switch]$AsJson
)

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    [Windows.Media.Ocr.OcrEngine, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.StorageFile, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null

    $resolved = (Resolve-Path $ImagePath).Path
    $fileTask = [Windows.Storage.StorageFile]::GetFileFromPathAsync($resolved)
    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod } | Select-Object -First 1
    $file = $asTaskGeneric.MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @($fileTask)).Result
    $streamTask = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = $asTaskGeneric.MakeGenericMethod([Windows.Storage.Streams.IRandomAccessStream]).Invoke($null, @($streamTask)).Result
    $decoderTask = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = $asTaskGeneric.MakeGenericMethod([Windows.Graphics.Imaging.BitmapDecoder]).Invoke($null, @($decoderTask)).Result
    $bitmapTask = $decoder.GetSoftwareBitmapAsync()
    $bitmap = $asTaskGeneric.MakeGenericMethod([Windows.Graphics.Imaging.SoftwareBitmap]).Invoke($null, @($bitmapTask)).Result
    if ($bitmap.BitmapPixelFormat -ne [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8 -or $bitmap.BitmapAlphaMode -ne [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied) {
        $bitmap = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert($bitmap, [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied)
    }
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if (-not $engine) {
        $engine = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | Select-Object -First 1
    }
    $ocrTask = $engine.RecognizeAsync($bitmap)
    $ocrResult = $asTaskGeneric.MakeGenericMethod([Windows.Media.Ocr.OcrResult]).Invoke($null, @($ocrTask)).Result
    if ($AsJson) {
        $linesArr = @()
        foreach ($line in $ocrResult.Lines) {
            $wordsArr = @()
            foreach ($w in $line.Words) {
                $wordsArr += @{
                    text = $w.Text
                    x = [math]::Round($w.BoundingRect.X, 2)
                    y = [math]::Round($w.BoundingRect.Y, 2)
                    width = [math]::Round($w.BoundingRect.Width, 2)
                    height = [math]::Round($w.BoundingRect.Height, 2)
                }
            }
            $linesArr += @{
                text = $line.Text
                words = $wordsArr
            }
        }
        $resultObj = @{
            text = $ocrResult.Text
            lines = $linesArr
        }
        Write-Output ($resultObj | ConvertTo-Json -Depth 5 -Compress)
    } else {
        if ($ocrResult.Lines) {
            foreach ($line in $ocrResult.Lines) {
                Write-Output $line.Text
            }
        } else {
            Write-Output $ocrResult.Text
        }
    }
} catch {
    Write-Error $_.Exception.Message
}
