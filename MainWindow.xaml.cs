using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Windows.Media.Animation;
using System.Windows.Controls.Primitives; // For Storyboard
namespace Wave;

public partial class MainWindow : Window
{
    public MainWindow()
    {
       InitializeComponent();
        
    }

   private void OpenProfileButton_Click(object sender, RoutedEventArgs e)
    {
        
        //MacroHub macroHub = new MacroHub();
        //macroHub.Show();
        //this.Close(); // Hide the current window
    }

    private void OpenGestureHubButton_Click(object sender, RoutedEventArgs e)
    {
        
        GestureHub gestureHub = new GestureHub();
        gestureHub.Show();
        this.Close(); // Hide the current window
    }

    private void OpenMacroHubButton_Click(object sender, RoutedEventArgs e)
    {
        
        MacroHub macroHub = new MacroHub();
        macroHub.Show();
        this.Close(); // Hide the current window
    }

     private void OpenAboutButton_Click(object sender, RoutedEventArgs e)
    {
        
        //MacroHub macroHub = new MacroHub();
        //macroHub.Show();
        //this.Close(); // Hide the current window
    }
     private void LogoutButton_Click(object sender, RoutedEventArgs e)
    {
        
        //MacroHub macroHub = new MacroHub();
        //macroHub.Show();
        //this.Close(); // Hide the current window
    }

    // Expands the menu when mouse enters
    private void SideMenu_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
    {
        // Start the expand animation
        (this.Resources["ExpandMenu"] as Storyboard).Begin();
    }

    // Collapses the menu when mouse leaves
    private void SideMenu_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
    {
        // Start the collapse animation
        (this.Resources["CollapseMenu"] as Storyboard).Begin();
    }

    // sets button swicth to on
    private void ToggleButton_Checked(object sender, RoutedEventArgs e)
{
    ToggleButton button = sender as ToggleButton;
    if (button != null)
    {
        string toggleButtonName = button.Name;

        // Change images based on the toggle button's name
        switch (toggleButtonName)
        {
            case "ToggleButton1":
                ChangeImage("ButtonImage1", "assets\\on_ph.png");
                break;
            case "ToggleButton2":
                ChangeImage("ButtonImage2", "assets\\on_ph.png");
                break;
            case "ToggleButton3":
                ChangeImage("ButtonImage3", "assets\\on_ph.png");
                break;
            
        }
    }
}

    // sets button swicth to off
    private void ToggleButton_Unchecked(object sender, RoutedEventArgs e)
    {
        ToggleButton button = sender as ToggleButton;
        if (button != null)
        {
            string toggleButtonName = button.Name;

            // Change images based on the toggle button's name
            switch (toggleButtonName)
            {
                case "ToggleButton1":
                    ChangeImage("ButtonImage1", "assets\\off_ph.png");
                    break;
                case "ToggleButton2":
                    ChangeImage("ButtonImage2", "assets\\off_ph.png");
                    break;
                case "ToggleButton3":;
                    ChangeImage("ButtonImage3", "assets\\off_ph.png");
                    break;
                // Add cases for other tiles...
            }
        }
    }

    //changes image source
    private void ChangeImage(string imageName, string imagePath)
    {
        Image img = this.FindName(imageName) as Image;
        if (img != null)
        {
            img.Source = new BitmapImage(new Uri(imagePath, UriKind.Relative));
        }
    }










}

