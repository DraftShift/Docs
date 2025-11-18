
## Semi-Automatic Update
If you are using the [Moonraker config](#), updating [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} can be as easy as pressing the update button in Mainsail/Fluidd. 

!!! note "Major Updates"
    Major updates that include python modifications will require you to rerun the install script. If you have updated via the Moonraker config and are experiencing issues, log in to the printer via SSH and run the following commands:

    ``` bash { .copy }
    cd ~/klipper-toolchanger-easy
    ./install.sh
    ```

## Manual Update
To do an manual update of [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"}, log in to the printer via SSH and run the following commands:

``` bash { .copy }
cd ~/klipper-toolchanger-easy
git pull
./install.sh
```