$pdf_path = "C:\Users\Public\Documents\Nextsense\cis\Exports\Pdf\VF8_F2" 
$pdf_url = "http:\\192.168.2.2:6030/ihm/post-fg-report"
$pdf_temp_path = "C:\Users\calipri\Desktop\temp"

Function Pdf-Report {
    $file = Get-ChildItem -Path $pdf_path -Filter "*.pdf" | Select-Object -ExpandProperty FullName
    $length = (Get-ChildItem -Path $pdf_path -Filter "*.pdf" | Measure-Object ).Count
    If ($length) {
        If ($length -eq 1) { $file_path = $file }
        else { $file_path = $file[0] }
        $prodnum = Split-Path $file_path -leaf
        $pdf = Get-Content -Path $file_path -Encoding Byte
        $base64 = [Convert]::ToBase64String($pdf) 
        $body = @{prodNum = $prodnum ; base64 = $base64 }
        $body
        $res = Invoke-WebRequest -Uri  $test_url -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        $res
        if ($res.StatusCode -eq 201) { Move-Item -Path $file_path  -Destination $pdf_temp_path }
    }
} 

$pingJob = Start-Job -ScriptBlock { 
    $ping_url = "127.0.0.1:3000/system-info/serviceStat"
    $body = @{ serviceName = "eyeflowService" }
    while (1) {
        Invoke-WebRequest -Uri  $ping_url -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        Start-Sleep 1
    }

} -Name Ping_Process

$csvJob = Start-Job -ScriptBlock {
    $csv_url = "127.0.0.1:3000/system-info/result"
    $csv_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\test" 
    $csv_temp_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\temp"
    $log_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\temp"
    $error_temp_path = "C:\Users\Admin\Desktop\Work Space\flush and gap\fag_service\temp"
    Function Csv-Report {
        if (Get-ChildItem -Path $csv_path -Filter "*.csv" -ErrorAction SilentlyContinue ) {
            $file = Get-ChildItem -Path $csv_path -Filter "*.csv" -ErrorAction SilentlyContinue  | Select-Object -ExpandProperty FullName 
            $length = (Get-ChildItem -Path $csv_path -Filter "*.csv" -ErrorAction Continue  | Measure-Object ).Count
            if ($length) {
                If ($length -eq 1) { $file_path = $file }
                else { $file_path = $file[0] }
                $meaResult = Get-Content -Path $file_path  | Select -Skip 5 | ConvertFrom-Csv -Delimiter ';'
                $csv = Import-Csv $file_path  -Delimiter ';' | Foreach-Object { 
                    foreach ($property in $_.PSObject.Properties) {
                        $property.value
                    } 
                }
                $body = @{id = $csv[1] ; data = $meaResult }  
                try {
                    $res = Invoke-WebRequest -Uri  $csv_url -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
                    if ($res.StatusCode -eq 201) {
                        Move-Item -Path $file_path  -Destination $csv_temp_path
                        $log = "$(Get-Date -Format "dddd MM/dd/yyyy HH:mm K") ID :$($csv[1]) HAS SENT"
                        Add-Content $log_path -Value  $log
                        Write-Host $log
                    }
                }
                catch {
                    $log = "$(Get-Date -Format "dddd MM/dd/yyyy HH:mm K") $(ParseErrorForResponseBody($_))"
                    Move-Item -Path $file_path  -Destination $error_temp_path
                    Add-Content $log_path -Value  $log
                    Write-Host $log
                }
            }           
        }
        else {
            $log = "$(Get-Date -Format "dddd MM/dd/yyyy HH:mm K") cant find any file"
            Write-Host $log
        }
    }
    function ParseErrorForResponseBody($Err) {
        if ($PSVersionTable.PSVersion.Major -lt 6) {
            if ($Error.Exception.Response) {  
                $Reader = New-Object System.IO.StreamReader($Err.Exception.Response.GetResponseStream())
                $Reader.BaseStream.Position = 0
                $Reader.DiscardBufferedData()
                $ResponseBody = $Reader.ReadToEnd()
                if ($ResponseBody.StartsWith('{')) {
                    $ResponseBody = $ResponseBody | ConvertFrom-Json
                }
                return $ResponseBody
            }
        }
        else {
            return $Er.ErrorDetails.Message
        }
    }

    while (1) {
        Csv-Report 
        Start-Sleep 1
    }
} -Name CSV_Upload_Process

while (1) {
    # $pingJob | Select-Object -Property *
    $pingJob
    $csvJob
    Start-Sleep 2
}