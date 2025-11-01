"""
Script to play frames from the HDF5 datasets as a video
"""

import h5py
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import numpy as np
from pathlib import Path


def play_video(h5_path, start_idx=0, num_frames=None, fps=30, title="Video"):
    """
    Play frames from an HDF5 file as a video animation

    Args:
        h5_path: Path to the HDF5 file
        start_idx: Starting frame index
        num_frames: Number of frames to play (None = play all from start_idx)
        fps: Frames per second for playback
        title: Title for the video window
    """
    with h5py.File(h5_path, "r") as f:
        frames_dset = f["frames"]
        total_frames = len(frames_dset)

        if num_frames is None:
            num_frames = total_frames - start_idx
        else:
            num_frames = min(num_frames, total_frames - start_idx)

        print(f"Total frames in {Path(h5_path).name}: {total_frames}")
        print(
            f"Playing {num_frames} frames starting from frame {start_idx} at {fps} FPS"
        )

        # Load frames into memory
        print("Loading frames...")
        frames = frames_dset[start_idx : start_idx + num_frames][:]

    # Convert BGR to RGB if needed
    if len(frames.shape) == 4 and frames.shape[3] == 3:
        frames = frames[:, :, :, ::-1]  # BGR to RGB

    # Create figure and axis
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.axis("off")

    # Initialize with first frame
    im = ax.imshow(frames[0])
    frame_text = ax.text(
        0.02,
        0.98,
        "",
        transform=ax.transAxes,
        color="white",
        fontsize=12,
        verticalalignment="top",
        bbox=dict(boxstyle="round", facecolor="black", alpha=0.7),
    )

    def update_frame(frame_num):
        """Update function for animation"""
        im.set_array(frames[frame_num])
        frame_text.set_text(f"Frame: {start_idx + frame_num}/{total_frames}")
        return [im, frame_text]

    # Create animation
    ani = animation.FuncAnimation(
        fig,
        update_frame,
        frames=num_frames,
        interval=1000 / fps,
        blit=True,
        repeat=True,
    )

    plt.title(f"{title} - Press 'q' to quit", fontsize=14, pad=10)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    data_dir = Path(__file__).parent.parent / "data"

    # Play Pole Position frames
    pole_position_path = data_dir / "pole_position_frames.h5"
    if pole_position_path.exists():
        print("\n=== Pole Position ===")
        play_video(
            pole_position_path,
            start_idx=0,
            num_frames=500,
            fps=30,
            title="Pole Position",
        )
    else:
        print(f"Pole Position dataset not found at {pole_position_path}")

    # Play Zelda frames
    zelda_path = data_dir / "zelda_frames.h5"
    if zelda_path.exists():
        print("\n=== Zelda ===")
        play_video(zelda_path, start_idx=0, num_frames=500, fps=30, title="Zelda")
    else:
        print(f"Zelda dataset not found at {zelda_path}")
