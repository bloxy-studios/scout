use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

type BuildResult<T> = Result<T, Box<dyn std::error::Error>>;

fn main() {
    if let Err(error) = generate_tauri_icons() {
        panic!("failed to generate Scout icons: {error}");
    }

    tauri_build::build()
}

fn generate_tauri_icons() -> BuildResult<()> {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR")?);
    let assets_dir = manifest_dir.join("../public/assets");
    let icons_dir = manifest_dir.join("icons");
    let out_dir = PathBuf::from(env::var("OUT_DIR")?);
    let iconset_dir = out_dir.join("Scout.iconset");

    for asset_name in [
        "16-mac.png",
        "32-mac.png",
        "64-mac.png",
        "128-mac.png",
        "256-mac.png",
        "512-mac.png",
        "1024-mac.png",
        "menu-icon.png",
    ] {
        println!("cargo:rerun-if-changed={}", assets_dir.join(asset_name).display());
    }

    fs::create_dir_all(&icons_dir)?;
    if iconset_dir.exists() {
        fs::remove_dir_all(&iconset_dir)?;
    }
    fs::create_dir_all(&iconset_dir)?;

    let source_16 = assets_dir.join("16-mac.png");
    let source_32 = assets_dir.join("32-mac.png");
    let source_64 = assets_dir.join("64-mac.png");
    let source_128 = assets_dir.join("128-mac.png");
    let source_256 = assets_dir.join("256-mac.png");
    let source_512 = assets_dir.join("512-mac.png");
    let source_1024 = assets_dir.join("1024-mac.png");

    convert_webp_alias_to_png(&source_32, &icons_dir.join("32x32.png"))?;
    convert_webp_alias_to_png(&source_128, &icons_dir.join("128x128.png"))?;
    convert_webp_alias_to_png(&source_256, &icons_dir.join("128x128@2x.png"))?;
    convert_webp_alias_to_png(&source_512, &icons_dir.join("icon.png"))?;

    convert_webp_alias_to_png(&source_16, &iconset_dir.join("icon_16x16.png"))?;
    convert_webp_alias_to_png(&source_32, &iconset_dir.join("icon_16x16@2x.png"))?;
    convert_webp_alias_to_png(&source_32, &iconset_dir.join("icon_32x32.png"))?;
    convert_webp_alias_to_png(&source_64, &iconset_dir.join("icon_32x32@2x.png"))?;
    convert_webp_alias_to_png(&source_128, &iconset_dir.join("icon_128x128.png"))?;
    convert_webp_alias_to_png(&source_256, &iconset_dir.join("icon_128x128@2x.png"))?;
    convert_webp_alias_to_png(&source_256, &iconset_dir.join("icon_256x256.png"))?;
    convert_webp_alias_to_png(&source_512, &iconset_dir.join("icon_256x256@2x.png"))?;
    convert_webp_alias_to_png(&source_512, &iconset_dir.join("icon_512x512.png"))?;
    convert_webp_alias_to_png(&source_1024, &iconset_dir.join("icon_512x512@2x.png"))?;

    generate_sized_png(&source_1024, &icons_dir.join("Square30x30Logo.png"), 30)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square44x44Logo.png"), 44)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square71x71Logo.png"), 71)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square89x89Logo.png"), 89)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square107x107Logo.png"), 107)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square142x142Logo.png"), 142)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square150x150Logo.png"), 150)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square284x284Logo.png"), 284)?;
    generate_sized_png(&source_1024, &icons_dir.join("Square310x310Logo.png"), 310)?;
    generate_sized_png(&source_1024, &icons_dir.join("StoreLogo.png"), 50)?;

    run_command(
        Command::new("iconutil")
            .arg("-c")
            .arg("icns")
            .arg(&iconset_dir)
            .arg("-o")
            .arg(icons_dir.join("icon.icns")),
        "generate icon.icns",
    )?;

    run_command(
        Command::new("ffmpeg")
            .arg("-y")
            .arg("-i")
            .arg(icons_dir.join("icon.png"))
            .arg("-vf")
            .arg("scale=256:256:flags=lanczos")
            .arg(icons_dir.join("icon.ico")),
        "generate icon.ico",
    )?;

    Ok(())
}

fn convert_webp_alias_to_png(input: &Path, output: &Path) -> BuildResult<()> {
    run_command(
        Command::new("sips")
            .arg("-s")
            .arg("format")
            .arg("png")
            .arg(input)
            .arg("--out")
            .arg(output),
        &format!("convert {} to png", input.display()),
    )
}

fn generate_sized_png(input: &Path, output: &Path, size: u32) -> BuildResult<()> {
    let size_arg = size.to_string();
    run_command(
        Command::new("sips")
            .arg("-s")
            .arg("format")
            .arg("png")
            .arg("-z")
            .arg(&size_arg)
            .arg(&size_arg)
            .arg(input)
            .arg("--out")
            .arg(output),
        &format!("generate {}x{} icon", size, size),
    )
}

fn run_command(command: &mut Command, context: &str) -> BuildResult<()> {
    let output = command.output()?;

    if output.status.success() {
        return Ok(());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    Err(format!(
        "{context} failed with status {}.\nstdout:\n{}\nstderr:\n{}",
        output.status,
        stdout.trim(),
        stderr.trim()
    )
    .into())
}
