#!/bin/bash

echo -e "\nRunning Veida AI deployment script...\n"

# count how many replacements are made
replacement_count=0

# hard-coded file paths
args_file="deploy/args.txt" # the file that hosts the argument variables
dev_frontend_dir="veidaai"  # the dev repo's frontend folder
dev_backend_dir="server"    # the dev repo's backend folder

# variables from the args file
args=()
prod_frontend_dir=""
prod_backend_dir=""
original_string=""
replacement_string=""

function remove_invisible_chars() {
    local input="$1"
    # Use 'tr' to remove non-printable characters and control characters
    # but keep spaces
    echo "$input" | tr -cd '[:print:][:space:]'
}

# extract the values from the args file and assign them to the args array
function extract_args {
    # read through the args file
    LINE=1
    while read -r CURRENT_LINE || [[ -n "$CURRENT_LINE" ]]; do

        # split the line string by "=" and store the split parts in an array
        IFS="=" read -r -a array <<< "$CURRENT_LINE"

        # append the value into the args array
        # args[$LINE-1] = array[1] <- pseudo-code for readability's sake
        args["$(($LINE-1))"]="${array[1]}"

        # increment the line being read
        ((LINE++))

    done < "$args_file"
}

# assign variables from args[] values
function assign_args {
    prod_frontend_dir="${args[0]}"
    prod_backend_dir="${args[1]}"
    original_string="${args[2]}"
    replacement_string="${args[3]}"
}

# remove invisible characters from the args
function clean_args {
    original_string="$(remove_invisible_chars "$original_string")"
    replacement_string="$(remove_invisible_chars "$replacement_string")"
    prod_frontend_dir="$(remove_invisible_chars "$prod_frontend_dir")"
    prod_backend_dir="$(remove_invisible_chars "$prod_backend_dir")"
}

#
# $1 filename from input_dir
# $2 output_dir
function create_output_file_name {
    local output_dir="$2"

    # split the input's filename by the first "/"
    IFS="/" read -r first_part second_part <<< "$1"
    
    local output_file_name=""$output_dir"/"$second_part""

    # echo "running create_output_file_name..."
    # echo -E "input_file_name: $1"
    # echo -E "first_input: $first_part"
    # echo -E "second_part: $second_part"
    # echo -E "output_dir: $output_dir"
    # declare -p output_dir
    # echo -E "output_file_name: "$output_file_name""
    echo -E "$output_file_name"
}

# this function will differentiate between files or directories
# $1 filePath
# returns "file", "dir", or "err"
function fileOrDirectory {
    # Store the argument in a variable
    local path="$1"

    # Check if the argument is a file
    if [ -f "$path" ]; then
        # echo "$path is a file."
        echo "file"

    # Check if the argument is a directory
    elif [ -d "$path" ]; then
        # echo "$path is a directory."
        echo "dir"

    # If it's neither a file nor a directory
    else
        # echo "$path is neither a file nor a directory."
        echo "err"
    fi
}

# replace_substring and create_new_copy directly copied from final.sh

# $1 full string
# $2 substring to replace
# $3 replacement to string
function replace_substring {
    local original_string="$1"
    local substring_to_replace="$2"
    local replacement_string="$3"

    # perform the replacement using parameter expansion
    local new_string="${original_string//$substring_to_replace/$replacement_string}"
    
    # return
    echo "$new_string"
}


# rewrite this so that it takes arguments instead
# $1 input_file
# $2 output_file
function create_new_copy {
    local input_file=$1
    local output_file=$2

    # check if the input file exists
    if [[ -f "$input_file" ]]; then
        # empty or create the output file
        > "$output_file"

        # read through input_file, and write to output_file
        LINE=1
        while read -r CURRENT_LINE || [[ -n "$CURRENT_LINE" ]]; do
            # perform the substring replacement within a subshell command substition
            modified_line=$(replace_substring "$CURRENT_LINE" "$original_string" "$replacement_string")

            # update the counter if a replacement was made
            if [[ "$CURRENT_LINE" != "$modified_line" ]]; then
                ((replacement_count++))
            fi

            # write the modified line to the output file
            echo "$modified_line" >> "$output_file"
            ((LINE++))
        done < "$input_file"

        # echo "File processed. New file saved to $output_file"
        
    # input file doesn't exist
    else
        echo "Input file does not exist: $input_file"
        echo "Double-check your file path"
    fi
}


# recursively navigate through directories and subdirectories
# execute substring replacement as we clone from input_dir to output_dir
# TODO: error handle output_dir not being a directory
# $1 input_dir
# $2 output_dir
main() {
    local input_dir="$1"
    local output_dir="$2"


    # if input_dir is indeed a directory
    if [ -d "$input_dir" ]; then
        local output_path=$(create_output_file_name "$input_dir" "$output_dir")
        # log the filepaths
        # if input_dir is a subdirectory
        if [[ "$input_dir" != "$dev_frontend_dir" && "$input_dir" != "$dev_backend_dir" ]]; then
            echo "Copying "$input_dir" -> "$output_path""
        # else input_dir is a dev root dir
        else
            echo "Copying "$input_dir" -> "$output_dir""
        fi 

        # Loop through all items in the directory
        for item in "$input_dir"/*; do

            # If the item is a directory, recursively call the function
            if [ -d "$item" ]; then
                mkdir $(create_output_file_name "$item" "$output_dir") # create the subdirectory
                main "$item" "$output_dir"                             # navigate into the subdirectory

            # If the item is a file, print its name
            elif [ -f "$item" ]; then
                # echo -e "\nFile: $item"

                # create the output_file clone
                local output_clone=$(create_output_file_name "$item" "$output_dir")
                create_new_copy "$item" "$output_clone"
            fi
        done
    else
        echo "Error: "$input_dir" is not a directory."
    fi
}

########################################
# this is where all the action happens #
########################################

# handle the arguments file
extract_args
assign_args
clean_args

# echo "
# _______ARGUMENTS_______
# original_string:    "$original_string"
# replacement_string: "$replacement_string"

# dev_frontend_dir:   "$dev_frontend_dir"
# prod_frontend_dir:  "$prod_frontend_dir"

# dev_backend_dir:    "$dev_backend_dir"
# prod_backend_dir:   "$prod_backend_dir"
# " 

# echo "
# As we copy ./"$dev_frontend_dir" into "$prod_frontend_dir"
# and copy ./"$dev_backend_dir" into "$prod_backend_dir",
# replace every instance of \""$original_string"\" with \""$replacement_string"\"
# "

# frontend directories
rm -r "$prod_frontend_dir"/*                  # burn it down
main "$dev_frontend_dir" "$prod_frontend_dir" # then rebuild

# backend directories
rm -r "$prod_backend_dir"/*                 # burn it down
main "$dev_backend_dir" "$prod_backend_dir" # then rebuild

echo -e "\nScript finished. $replacement_count total replacements made"